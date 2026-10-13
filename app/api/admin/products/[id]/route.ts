import { serializeProduct } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { isRecordId, jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import {
  blankToNull,
  firstZodMessage,
  normalizeWeight,
  productPatchSchema,
} from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { orderBy: { sku: "asc" as const } },
  images: { orderBy: [{ is_primary: "desc" as const }, { sort_order: "asc" as const }] },
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Product not found.", 404);

  const parsed = productPatchSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  const data = parsed.data;
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.category_id !== undefined ? { category_id: data.category_id } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: blankToNull(data.description) } : {}),
        ...(data.purity !== undefined ? { purity: data.purity } : {}),
        ...(data.base_weight !== undefined ? { base_weight: normalizeWeight(data.base_weight) } : {}),
        ...(data.is_visible !== undefined ? { is_visible: data.is_visible } : {}),
        ...(data.show_price !== undefined ? { show_price: data.show_price } : {}),
        ...(data.sort_order !== undefined ? { sort_order: data.sort_order } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: productInclude,
    });
    return jsonData(serializeProduct(product));
  } catch (error) {
    const known = prismaError(error, "Product not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "product update failed");
    return jsonError("Request failed.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Product not found.", 404);

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return jsonError("Product not found.", 404);

  const referenced = await prisma.orderItem.count({
    where: { variant: { product_id: id } },
  });

  await prisma.product.update({
    where: { id },
    data: { is_visible: false, status: "ARCHIVED" },
  });

  return jsonData({
    ok: true,
    deleted: "soft",
    message: referenced
      ? "Product hidden and archived because an order still references it."
      : "Product hidden and archived. Catalog history is kept.",
  });
}
