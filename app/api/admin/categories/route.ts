import { prisma } from "@/lib/db";
import { jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import { blankToNull, categoryWriteSchema, firstZodMessage } from "@/lib/validators";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const categories = await prisma.category.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return jsonData({
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sort_order: category.sort_order,
      product_count: category._count.products,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = categoryWriteSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  try {
    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: blankToNull(parsed.data.description),
        sort_order: parsed.data.sort_order ?? 0,
      },
    });
    return jsonData(
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        sort_order: category.sort_order,
        product_count: 0,
      },
      201,
    );
  } catch (error) {
    const known = prismaError(error, "Category not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "category create failed");
    return jsonError("Request failed.", 500);
  }
}
