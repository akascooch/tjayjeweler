import { cartTotals } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { type OrderContactInput, orderReviewSchema } from "@/lib/orders-schema";
import { z } from "zod";

export type { OrderContactInput } from "@/lib/orders-schema";
export { orderContactSchema, orderReviewSchema } from "@/lib/orders-schema";

function normalizePriceNumber(value: { toString(): string } | number | string) {
  return Number(typeof value === "object" && value !== null && "toString" in value ? value.toString() : value);
}

export async function createCardTransferOrder(input: OrderContactInput & { receiptImage: string }) {
  const email = input.email?.trim() ? input.email.trim() : null;
  const phone = input.phone.trim();
  const requested = new Map<string, number>();
  for (const item of input.items) {
    requested.set(item.variantId, (requested.get(item.variantId) ?? 0) + item.quantity);
  }

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: [...requested.keys()] },
      product: { is_visible: true, status: "ACTIVE" },
    },
    select: {
      id: true,
      sku: true,
      price: true,
      stock_quantity: true,
      show_price_override: true,
      product: { select: { id: true, title: true, show_price: true } },
    },
  });

  if (variants.length !== requested.size) {
    return { ok: false as const, status: 400, message: "One or more bag items are no longer available." };
  }

  const lines: {
    variantId: string;
    quantity: number;
    unitPriceIrt: number;
  }[] = [];

  for (const variant of variants) {
    const quantity = requested.get(variant.id) ?? 0;
    const unitPrice = normalizePriceNumber(variant.price);
    const showPrice =
      variant.show_price_override === null ? variant.product.show_price : variant.show_price_override;
    if (!showPrice || unitPrice <= 0) {
      return { ok: false as const, status: 400, message: "A bag item requires a custom price request." };
    }
    if (variant.stock_quantity < quantity) {
      return {
        ok: false as const,
        status: 409,
        message: `Only ${variant.stock_quantity} left for ${variant.product.title}.`,
      };
    }
    lines.push({ variantId: variant.id, quantity, unitPriceIrt: unitPrice });
  }

  const totals = cartTotals(lines);
  if (totals.subtotalIrt <= 0) {
    return { ok: false as const, status: 400, message: "Order total is invalid." };
  }

  const order = await prisma
    .$transaction(async (tx) => {
      for (const line of lines) {
        const updated = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock_quantity: { gte: line.quantity } },
          data: { stock_quantity: { decrement: line.quantity } },
        });
        if (updated.count !== 1) throw new Error("STOCK_CONFLICT");
      }

      return tx.order.create({
        data: {
          email,
          phone,
          status: "PENDING_VERIFICATION",
          currency: "IRT",
          total_amount: totals.subtotalIrt.toFixed(2),
          payment_gateway: "card_transfer",
          receipt_image: input.receiptImage,
          items: {
            create: lines.map((line) => ({
              variant_id: line.variantId,
              quantity: line.quantity,
              unit_price: line.unitPriceIrt.toFixed(2),
            })),
          },
          transactions: {
            create: {
              gateway: "card_transfer",
              amount_irt: totals.subtotalIrt.toFixed(2),
              amount_rial: totals.subtotalRial,
              status: "PENDING_VERIFICATION",
            },
          },
        },
        select: { id: true, status: true, total_amount: true },
      });
    })
    .catch((error: unknown) => {
      if (error instanceof Error && error.message === "STOCK_CONFLICT") return null;
      throw error;
    });

  if (!order) {
    return { ok: false as const, status: 409, message: "Stock changed while placing the order. Refresh your bag." };
  }

  return {
    ok: true as const,
    orderId: order.id,
    status: order.status,
    amountIrt: normalizePriceNumber(order.total_amount),
  };
}

export async function reviewCardTransferOrder(
  orderId: string,
  input: z.infer<typeof orderReviewSchema>,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, transactions: { orderBy: { created_at: "desc" }, take: 1 } },
  });
  if (!order) return { ok: false as const, status: 404, message: "Order not found." };
  if (order.payment_gateway !== "card_transfer") {
    return { ok: false as const, status: 400, message: "This order is not a card transfer." };
  }

  const allowed =
    (order.status === "PENDING_VERIFICATION" &&
      (input.status === "PAYMENT_APPROVED" || input.status === "PAYMENT_REJECTED")) ||
    (order.status === "PAYMENT_APPROVED" &&
      (input.status === "PROCESSING" || input.status === "COMPLETED" || input.status === "PAYMENT_REJECTED")) ||
    (order.status === "PROCESSING" && (input.status === "COMPLETED" || input.status === "PAYMENT_REJECTED"));

  if (!allowed) {
    return { ok: false as const, status: 409, message: "That status change is not allowed for this order." };
  }

  const restoringStock = input.status === "PAYMENT_REJECTED";
  const markingPaid =
    input.status === "PAYMENT_APPROVED" || input.status === "PROCESSING" || input.status === "COMPLETED";

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        staff_note: input.staff_note?.trim() ? input.staff_note.trim() : order.staff_note,
        paid_at: restoringStock ? null : markingPaid ? (order.paid_at ?? new Date()) : order.paid_at,
      },
    });

    if (order.transactions[0]) {
      await tx.paymentTransaction.update({
        where: { id: order.transactions[0].id },
        data: { status: input.status },
      });
    }

    if (restoringStock) {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variant_id },
          data: { stock_quantity: { increment: item.quantity } },
        });
      }
    }
  });

  return { ok: true as const, orderId: order.id, status: input.status };
}
