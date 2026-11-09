import { cartTotals, irtToRial } from "@/lib/cart";
import { type CheckoutBody } from "@/lib/checkout-schema";
import { prisma } from "@/lib/db";
import { isSuccessfulVerifyCode, zarinpalRequestPayment, zarinpalVerifyPayment } from "@/lib/zarinpal";

export type { CheckoutBody } from "@/lib/checkout-schema";
export { checkoutBodySchema, checkoutItemSchema } from "@/lib/checkout-schema";

function appBaseUrl(request: Request) {
  const configured = (process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
  if (configured) return configured;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (!host) return "https://tjayjeweler.com";
  return `${proto}://${host}`;
}

function normalizePriceNumber(value: { toString(): string } | number | string) {
  return Number(typeof value === "object" && value !== null && "toString" in value ? value.toString() : value);
}

export async function createCheckoutSession(request: Request, body: CheckoutBody) {
  const email = body.email?.trim() ? body.email.trim() : null;
  const phone = body.phone?.trim() ? body.phone.trim() : null;
  const requested = new Map<string, number>();
  for (const item of body.items) {
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
    title: string;
    sku: string;
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
    lines.push({
      variantId: variant.id,
      quantity,
      unitPriceIrt: unitPrice,
      title: variant.product.title,
      sku: variant.sku,
    });
  }

  const totals = cartTotals(lines);
  if (totals.subtotalRial < 1000) {
    return { ok: false as const, status: 400, message: "Order total is below the payment minimum." };
  }

  const order = await prisma
    .$transaction(async (tx) => {
      for (const line of lines) {
        const updated = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock_quantity: { gte: line.quantity } },
          data: { stock_quantity: { decrement: line.quantity } },
        });
        if (updated.count !== 1) {
          throw new Error("STOCK_CONFLICT");
        }
      }

      return tx.order.create({
        data: {
          email,
          status: "PENDING",
          currency: "IRT",
          total_amount: totals.subtotalIrt.toFixed(2),
          payment_gateway: "zarinpal",
          items: {
            create: lines.map((line) => ({
              variant_id: line.variantId,
              quantity: line.quantity,
              unit_price: line.unitPriceIrt.toFixed(2),
            })),
          },
          transactions: {
            create: {
              gateway: "zarinpal",
              amount_irt: totals.subtotalIrt.toFixed(2),
              amount_rial: totals.subtotalRial,
              status: "REQUESTING",
            },
          },
        },
        include: { transactions: true },
      });
    })
    .catch((error: unknown) => {
      if (error instanceof Error && error.message === "STOCK_CONFLICT") return null;
      throw error;
    });

  if (!order) {
    return { ok: false as const, status: 409, message: "Stock changed while preparing checkout. Refresh your bag." };
  }

  const callbackUrl = `${appBaseUrl(request)}/api/checkout/verify`;
  const payment = await zarinpalRequestPayment({
    amountRial: totals.subtotalRial,
    description: `TJAY order ${order.id}`,
    callbackUrl,
    email,
    mobile: phone,
    orderId: order.id,
  });

  const transaction = order.transactions[0];
  if (!payment.ok) {
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: "REQUEST_FAILED", request_code: payment.code },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      for (const line of lines) {
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stock_quantity: { increment: line.quantity } },
        });
      }
    });
    return { ok: false as const, status: 502, message: payment.message };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { authority_code: payment.authority },
    }),
    prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        authority: payment.authority,
        status: "REDIRECTED",
        request_code: payment.code,
      },
    }),
  ]);

  return {
    ok: true as const,
    orderId: order.id,
    authority: payment.authority,
    paymentUrl: payment.paymentUrl,
    amountIrt: totals.subtotalIrt,
    amountRial: totals.subtotalRial,
  };
}

export async function verifyCheckoutPayment(authority: string, gatewayStatus: string | null) {
  const order = await prisma.order.findFirst({
    where: { authority_code: authority },
    include: {
      items: true,
      transactions: { orderBy: { created_at: "desc" }, take: 1 },
    },
  });

  if (!order) {
    return { ok: false as const, status: "not_found" as const, message: "Order not found for this payment." };
  }

  if (order.status === "PAID") {
    return {
      ok: true as const,
      status: "paid" as const,
      orderId: order.id,
      refId: order.ref_id,
      amountIrt: normalizePriceNumber(order.total_amount),
      message: "Payment already confirmed.",
    };
  }

  if ((gatewayStatus ?? "").toUpperCase() !== "OK") {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      if (order.transactions[0]) {
        await tx.paymentTransaction.update({
          where: { id: order.transactions[0].id },
          data: { status: "CANCELLED" },
        });
      }
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variant_id },
          data: { stock_quantity: { increment: item.quantity } },
        });
      }
    });
    return {
      ok: false as const,
      status: "cancelled" as const,
      orderId: order.id,
      message: "Payment was cancelled.",
    };
  }

  const amountRial = irtToRial(normalizePriceNumber(order.total_amount));
  const verified = await zarinpalVerifyPayment({ amountRial, authority });
  if (!verified.ok) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      if (order.transactions[0]) {
        await tx.paymentTransaction.update({
          where: { id: order.transactions[0].id },
          data: {
            status: "VERIFY_FAILED",
            verify_code: verified.code,
          },
        });
      }
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variant_id },
          data: { stock_quantity: { increment: item.quantity } },
        });
      }
    });
    return {
      ok: false as const,
      status: "failed" as const,
      orderId: order.id,
      message: verified.message,
    };
  }

  if (!isSuccessfulVerifyCode(verified.code)) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      if (order.transactions[0]) {
        await tx.paymentTransaction.update({
          where: { id: order.transactions[0].id },
          data: {
            status: "VERIFY_FAILED",
            verify_code: verified.code,
          },
        });
      }
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variant_id },
          data: { stock_quantity: { increment: item.quantity } },
        });
      }
    });
    return {
      ok: false as const,
      status: "failed" as const,
      orderId: order.id,
      message: "Payment verification failed.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        ref_id: verified.refId,
        tracking_code: verified.refId,
        paid_at: new Date(),
      },
    });
    if (order.transactions[0]) {
      await tx.paymentTransaction.update({
        where: { id: order.transactions[0].id },
        data: {
          status: verified.code === 101 ? "ALREADY_VERIFIED" : "PAID",
          verify_code: verified.code,
          ref_id: verified.refId,
        },
      });
    }
  });

  return {
    ok: true as const,
    status: "paid" as const,
    orderId: order.id,
    refId: verified.refId,
    amountIrt: normalizePriceNumber(order.total_amount),
    message: "Payment confirmed.",
  };
}
