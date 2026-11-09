import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { access, constants, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../lib/db";
import {
  encodeProductImage,
  mediaRoot,
  receiptMediaPath,
  removeReceiptImageFile,
  storeReceiptImage,
} from "../lib/media";
import { createCardTransferOrder, reviewCardTransferOrder } from "../lib/orders";
import { getPublicBankSettings, updateBankSettings } from "../lib/store-settings";

const SMOKE_PHONE = "09120001111";
const SMOKE_EMAIL = "smoke+phase11@tjayjeweler.local";
const SMOKE_SKU = "TJ-SMOKE-PHASE11";
const SMOKE_SLUG = "phase11-smoke-piece";

async function ensureBankConfigured() {
  const publicSettings = await getPublicBankSettings();
  if (publicSettings.configured) return publicSettings;

  const card = (process.env.BANK_CARD_NUMBER ?? "6037991122334455").replace(/\D/g, "");
  const holder = (process.env.BANK_CARD_HOLDER ?? "TJAY JEWELER").trim();
  const bank = (process.env.BANK_NAME ?? "Melli").trim();
  await updateBankSettings({
    bank_card_number: card,
    bank_card_holder: holder,
    bank_name: bank,
  });
  return getPublicBankSettings();
}

async function ensureSmokeVariant() {
  const category =
    (await prisma.category.findFirst({ orderBy: { sort_order: "asc" } })) ??
    (await prisma.category.create({
      data: { name: "Rings", slug: "rings", sort_order: 0 },
    }));

  const product = await prisma.product.upsert({
    where: { slug: SMOKE_SLUG },
    create: {
      category_id: category.id,
      title: "Phase 11 Smoke Piece",
      slug: SMOKE_SLUG,
      description: "Operational smoke SKU. Safe to hide after launch checks.",
      purity: "925",
      base_weight: "10.000",
      is_visible: true,
      show_price: true,
      status: "ACTIVE",
      sort_order: 9999,
    },
    update: {
      is_visible: true,
      show_price: true,
      status: "ACTIVE",
    },
  });

  const existing = await prisma.productVariant.findUnique({ where: { sku: SMOKE_SKU } });
  if (existing) {
    return prisma.productVariant.update({
      where: { id: existing.id },
      data: {
        product_id: product.id,
        stock_quantity: Math.max(existing.stock_quantity, 2),
        price: "150000.00",
        show_price_override: true,
      },
      select: {
        id: true,
        sku: true,
        stock_quantity: true,
        price: true,
        product: { select: { title: true } },
      },
    });
  }

  return prisma.productVariant.create({
    data: {
      product_id: product.id,
      sku: SMOKE_SKU,
      stock_quantity: 2,
      price: "150000.00",
      show_price_override: true,
      additional_weight: "0.000",
    },
    select: {
      id: true,
      sku: true,
      stock_quantity: true,
      price: true,
      product: { select: { title: true } },
    },
  });
}

async function mockReceiptPng() {
  return sharp({
    create: {
      width: 640,
      height: 480,
      channels: 3,
      background: { r: 245, g: 245, b: 240 },
    },
  })
    .png()
    .toBuffer();
}

async function assertReceiptStorage(file: string) {
  const fullPath = receiptMediaPath(file);
  const info = await stat(fullPath);
  if (!info.isFile()) throw new Error("Receipt file missing after store");
  if (!file.endsWith(".webp")) throw new Error("Receipt must be re-encoded as .webp");
  if (path.extname(fullPath) !== ".webp") throw new Error("Receipt extension invalid");

  const root = path.resolve(mediaRoot());
  const receiptsDir = path.resolve(root, "receipts");
  if (!path.resolve(fullPath).startsWith(receiptsDir + path.sep) && path.resolve(fullPath) !== receiptsDir) {
    throw new Error("Receipt escaped receipts directory");
  }

  await access(fullPath, constants.R_OK);
  return fullPath;
}

async function main() {
  const cleanup = process.argv.includes("--cleanup");
  const bank = await ensureBankConfigured();
  if (!bank.configured) throw new Error("Bank settings are not configured");

  const variant = await ensureSmokeVariant();
  const stockBefore = variant.stock_quantity;

  const png = await mockReceiptPng();
  const encoded = await encodeProductImage(png);
  const receiptFile = await storeReceiptImage(encoded.data);
  const receiptPath = await assertReceiptStorage(receiptFile);

  const created = await createCardTransferOrder({
    email: SMOKE_EMAIL,
    phone: SMOKE_PHONE,
    items: [{ variantId: variant.id, quantity: 1 }],
    receiptImage: receiptFile,
  });
  if (!created.ok) {
    await removeReceiptImageFile(receiptFile).catch(() => undefined);
    throw new Error(created.message);
  }

  const pending = await prisma.order.findUnique({
    where: { id: created.orderId },
    select: {
      id: true,
      status: true,
      payment_gateway: true,
      receipt_image: true,
    },
  });
  if (!pending || pending.status !== "PENDING_VERIFICATION") {
    throw new Error(`Expected PENDING_VERIFICATION, got ${pending?.status ?? "missing"}`);
  }
  if (pending.receipt_image !== receiptFile) throw new Error("Receipt filename mismatch on order");
  if (pending.payment_gateway !== "card_transfer") throw new Error("Unexpected payment gateway");

  const afterHold = await prisma.productVariant.findUnique({
    where: { id: variant.id },
    select: { stock_quantity: true },
  });
  if ((afterHold?.stock_quantity ?? -1) !== stockBefore - 1) {
    throw new Error("Stock was not held after order create");
  }

  const approved = await reviewCardTransferOrder(created.orderId, {
    status: "PAYMENT_APPROVED",
    staff_note: `phase11-smoke ${randomUUID()}`,
  });
  if (!approved.ok) throw new Error(approved.message);

  const processing = await reviewCardTransferOrder(created.orderId, {
    status: "PROCESSING",
  });
  if (!processing.ok) throw new Error(processing.message);

  const finalOrder = await prisma.order.findUnique({
    where: { id: created.orderId },
    select: { id: true, status: true, paid_at: true },
  });
  if (!finalOrder || finalOrder.status !== "PROCESSING") {
    throw new Error(`Expected PROCESSING, got ${finalOrder?.status ?? "missing"}`);
  }

  if (cleanup) {
    await prisma.paymentTransaction.deleteMany({ where: { order_id: created.orderId } });
    await prisma.orderItem.deleteMany({ where: { order_id: created.orderId } });
    await prisma.order.delete({ where: { id: created.orderId } });
    await removeReceiptImageFile(receiptFile).catch(() => undefined);
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock_quantity: { increment: 1 } },
    });
  }

  const digest = createHash("sha256").update(encoded.data).digest("hex").slice(0, 12);

  console.log(
    JSON.stringify(
      {
        ok: true,
        cleanup,
        bank: {
          bank_name: bank.bank_name,
          card_last4: bank.bank_card_number.slice(-4),
        },
        variant: { id: variant.id, sku: variant.sku, title: variant.product.title },
        orderId: created.orderId,
        statuses: ["PENDING_VERIFICATION", "PAYMENT_APPROVED", "PROCESSING"],
        receipt: {
          file: receiptFile,
          path: receiptPath,
          webp: true,
          under_media_receipts: true,
          sha256_12: digest,
        },
        stock: { before: stockBefore, after_hold: afterHold?.stock_quantity ?? null },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "smoke failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
