import { serializeImage } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { isRecordId, jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import { blankToNull, firstZodMessage, imageWriteSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Product not found.", 404);

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return jsonError("Product not found.", 404);

  const parsed = imageWriteSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  try {
    const image = await prisma.$transaction(async (tx) => {
      if (parsed.data.is_primary) {
        await tx.productImage.updateMany({
          where: { product_id: id },
          data: { is_primary: false },
        });
      }
      return tx.productImage.create({
        data: {
          product_id: id,
          url: parsed.data.url,
          alt_text: blankToNull(parsed.data.alt_text),
          sort_order: parsed.data.sort_order ?? 0,
          is_primary: parsed.data.is_primary ?? false,
        },
      });
    });
    return jsonData(serializeImage(image), 201);
  } catch (error) {
    const known = prismaError(error, "Image not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "image create failed");
    return jsonError("Request failed.", 500);
  }
}
