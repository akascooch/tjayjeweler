import { serializeImage } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { isRecordId, jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import { blankToNull, firstZodMessage, imagePatchSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Image not found.", 404);

  const parsed = imagePatchSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);
  const data = parsed.data;

  try {
    const image = await prisma.$transaction(async (tx) => {
      const current = await tx.productImage.findUnique({ where: { id } });
      if (!current) return null;
      if (data.is_primary) {
        await tx.productImage.updateMany({
          where: { product_id: current.product_id },
          data: { is_primary: false },
        });
      }
      return tx.productImage.update({
        where: { id },
        data: {
          ...(data.url !== undefined ? { url: data.url } : {}),
          ...(data.alt_text !== undefined ? { alt_text: blankToNull(data.alt_text) } : {}),
          ...(data.sort_order !== undefined ? { sort_order: data.sort_order } : {}),
          ...(data.is_primary !== undefined ? { is_primary: data.is_primary } : {}),
        },
      });
    });
    if (!image) return jsonError("Image not found.", 404);
    return jsonData(serializeImage(image));
  } catch (error) {
    const known = prismaError(error, "Image not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "image update failed");
    return jsonError("Request failed.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Image not found.", 404);

  try {
    await prisma.productImage.delete({ where: { id } });
    return jsonData({ ok: true });
  } catch (error) {
    const known = prismaError(error, "Image not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "image delete failed");
    return jsonError("Request failed.", 500);
  }
}
