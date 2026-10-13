import { prisma } from "@/lib/db";
import { isRecordId, jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import { blankToNull, categoryWriteSchema, firstZodMessage } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Category not found.", 404);

  const parsed = categoryWriteSchema.partial().safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);
  if (Object.keys(parsed.data).length === 0) return jsonError("Nothing to update.", 400);

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
        ...(parsed.data.description !== undefined
          ? { description: blankToNull(parsed.data.description) }
          : {}),
        ...(parsed.data.sort_order !== undefined ? { sort_order: parsed.data.sort_order } : {}),
      },
      include: { _count: { select: { products: true } } },
    });
    return jsonData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sort_order: category.sort_order,
      product_count: category._count.products,
    });
  } catch (error) {
    const known = prismaError(error, "Category not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "category update failed");
    return jsonError("Request failed.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Category not found.", 404);

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) return jsonError("Category not found.", 404);
  if (category._count.products > 0) {
    return jsonError("Move or archive the products in this category before deleting it.", 409);
  }

  await prisma.category.delete({ where: { id } });
  return jsonData({ ok: true });
}
