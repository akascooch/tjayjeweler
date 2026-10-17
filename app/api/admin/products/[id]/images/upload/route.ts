import { z } from "zod";
import { serializeImage } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { isRecordId, jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError } from "@/lib/http";
import {
  encodeProductImage,
  ImageRejected,
  MAX_UPLOAD_BYTES,
  removeProductImageFile,
  storeProductImage,
} from "@/lib/media";
import { PRODUCT_MEDIA_PREFIX } from "@/lib/media-path";
import { allowAttempt } from "@/lib/rate-limit";
import { blankToNull, firstZodMessage } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const MAX_ACTIVE_UPLOADS = 2;
let activeUploads = 0;

const fieldsSchema = z.object({
  alt_text: z.string().trim().max(200).optional(),
  is_primary: z.enum(["true", "false"]).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  if (!allowAttempt(`upload:${auth.user.id}`, 30, 10 * 60 * 1000)) {
    return jsonError("Too many uploads. Try again in a few minutes.", 429);
  }

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Product not found.", 404);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return jsonError("Send the image as multipart form data.", 415);
  }
  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) return jsonError("Content length is required.", 411);
  if (length > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) return jsonError("Images can be at most 15 MB.", 413);

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return jsonError("Product not found.", 404);

  if (activeUploads >= MAX_ACTIVE_UPLOADS) {
    return jsonError("Another upload is still processing. Try again shortly.", 503);
  }
  activeUploads += 1;
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonError("The upload could not be read.", 400);
    }

    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) return jsonError("Choose an image to upload.", 400);
    if (file.size > MAX_UPLOAD_BYTES) return jsonError("Images can be at most 15 MB.", 413);

    const fields = fieldsSchema.safeParse({
      alt_text: form.get("alt_text") ?? undefined,
      is_primary: form.get("is_primary") ?? undefined,
    });
    if (!fields.success) return jsonError(firstZodMessage(fields.error), 400);

    let encoded: Awaited<ReturnType<typeof encodeProductImage>>;
    try {
      encoded = await encodeProductImage(Buffer.from(await file.arrayBuffer()));
    } catch (error) {
      if (error instanceof ImageRejected) return jsonError(error.message, 400);
      throw error;
    }

    const stored = await storeProductImage(encoded.data);
    try {
      const image = await prisma.$transaction(async (tx) => {
        const count = await tx.productImage.count({ where: { product_id: id } });
        const primary = count === 0 || fields.data.is_primary === "true";
        if (primary) {
          await tx.productImage.updateMany({ where: { product_id: id }, data: { is_primary: false } });
        }
        return tx.productImage.create({
          data: {
            product_id: id,
            url: `${PRODUCT_MEDIA_PREFIX}${stored}`,
            alt_text: blankToNull(fields.data.alt_text),
            is_primary: primary,
            sort_order: count,
          },
        });
      });
      return jsonData(
        { ...serializeImage(image), width: encoded.width, height: encoded.height, bytes: encoded.data.length },
        201,
      );
    } catch (error) {
      await removeProductImageFile(stored).catch(() => undefined);
      const known = prismaError(error, "Product not found.");
      if (known) return known;
      console.error(error instanceof Error ? error.name : "image upload failed");
      return jsonError("Request failed.", 500);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.name : "image upload failed");
    return jsonError("Request failed.", 500);
  } finally {
    activeUploads -= 1;
  }
}
