import { listAdminProducts, serializeProduct } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import {
  blankToNull,
  firstZodMessage,
  normalizeWeight,
  productWriteSchema,
} from "@/lib/validators";

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { orderBy: { sku: "asc" as const } },
  images: { orderBy: [{ is_primary: "desc" as const }, { sort_order: "asc" as const }] },
};

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  return jsonData({ products: await listAdminProducts() });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = productWriteSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  try {
    const product = await prisma.product.create({
      data: {
        category_id: parsed.data.category_id,
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: blankToNull(parsed.data.description),
        purity: parsed.data.purity ?? "925",
        base_weight: normalizeWeight(parsed.data.base_weight ?? "0"),
        is_visible: parsed.data.is_visible ?? true,
        show_price: parsed.data.show_price ?? true,
        sort_order: parsed.data.sort_order ?? 0,
        status: parsed.data.status ?? "ACTIVE",
      },
      include: productInclude,
    });
    return jsonData(serializeProduct(product), 201);
  } catch (error) {
    const known = prismaError(error, "Product not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "product create failed");
    return jsonError("Request failed.", 500);
  }
}
