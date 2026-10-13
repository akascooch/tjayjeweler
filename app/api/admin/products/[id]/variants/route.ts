import { serializeVariant } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { isRecordId, jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import {
  blankToNull,
  firstZodMessage,
  normalizePrice,
  normalizeWeight,
  variantWriteSchema,
} from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Product not found.", 404);

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return jsonError("Product not found.", 404);

  const parsed = variantWriteSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  try {
    const variant = await prisma.productVariant.create({
      data: {
        product_id: id,
        sku: parsed.data.sku,
        price: normalizePrice(parsed.data.price),
        stock_quantity: parsed.data.stock_quantity,
        additional_weight: normalizeWeight(parsed.data.weight_grams ?? "0"),
        ring_size: blankToNull(parsed.data.ring_size),
        chain_length: blankToNull(parsed.data.chain_length),
        show_price_override: parsed.data.show_price_override ?? null,
      },
    });
    return jsonData(serializeVariant(variant), 201);
  } catch (error) {
    const known = prismaError(error, "Variant not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "variant create failed");
    return jsonError("Request failed.", 500);
  }
}
