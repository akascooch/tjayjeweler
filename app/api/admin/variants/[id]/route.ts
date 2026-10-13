import { serializeVariant } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { isRecordId, jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import {
  blankToNull,
  firstZodMessage,
  normalizePrice,
  normalizeWeight,
  variantUpdateSchema,
} from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Variant not found.", 404);

  const parsed = variantUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);
  const data = parsed.data;

  try {
    const variant = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.price !== undefined ? { price: normalizePrice(data.price) } : {}),
        ...(data.stock_quantity !== undefined ? { stock_quantity: data.stock_quantity } : {}),
        ...(data.weight_grams !== undefined
          ? { additional_weight: normalizeWeight(data.weight_grams) }
          : {}),
        ...(data.ring_size !== undefined ? { ring_size: blankToNull(data.ring_size) } : {}),
        ...(data.chain_length !== undefined
          ? { chain_length: blankToNull(data.chain_length) }
          : {}),
        ...(data.show_price_override !== undefined
          ? { show_price_override: data.show_price_override }
          : {}),
      },
    });
    return jsonData(serializeVariant(variant));
  } catch (error) {
    const known = prismaError(error, "Variant not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "variant update failed");
    return jsonError("Request failed.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Variant not found.", 404);

  const [orders, holds] = await Promise.all([
    prisma.orderItem.count({ where: { variant_id: id } }),
    prisma.inventoryReservation.count({ where: { variant_id: id } }),
  ]);
  if (orders > 0 || holds > 0) {
    return jsonError("This variant is referenced by an order or reservation and cannot be deleted.", 409);
  }

  try {
    await prisma.productVariant.delete({ where: { id } });
    return jsonData({ ok: true });
  } catch (error) {
    const known = prismaError(error, "Variant not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "variant delete failed");
    return jsonError("Request failed.", 500);
  }
}
