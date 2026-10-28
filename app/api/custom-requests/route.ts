import { isRecordId, jsonData } from "@/lib/admin";
import { assertSameOrigin, clientAddress } from "@/lib/csrf";
import {
  customRequestFieldsSchema,
  customRequestHash,
  duplicateDecision,
} from "@/lib/custom-request";
import { CustomRequestConflict, findCustomRequestByKey, saveCustomRequest } from "@/lib/custom-request-store";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import {
  encodeProductImage,
  ImageRejected,
  MAX_UPLOAD_BYTES,
  removeRequestImageFile,
  storeRequestImage,
} from "@/lib/media";
import { allowAttempt } from "@/lib/rate-limit";
import { blankToNull, firstZodMessage } from "@/lib/validators";

export const runtime = "nodejs";

const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

function textField(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Cross-site request blocked.", 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return jsonError("Send the request as multipart form data.", 415);
  }
  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) return jsonError("Content length is required.", 411);
  if (length > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
    return jsonError("Images can be at most 15 MB.", 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("The request could not be read.", 400);
  }

  const productId = blankToNull(textField(form, "product_id"));
  const parsed = customRequestFieldsSchema.safeParse({
    kind: textField(form, "kind"),
    product_id: productId ?? undefined,
    description: textField(form, "description"),
    contact_name: textField(form, "contact_name"),
    contact_phone: textField(form, "contact_phone"),
    idempotency_key: request.headers.get("idempotency-key") ?? "",
  });
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  const file = form.get("file");
  const hasFile = file instanceof Blob && file.size > 0;
  if (file instanceof Blob && file.size > MAX_UPLOAD_BYTES) {
    return jsonError("Images can be at most 15 MB.", 413);
  }

  const contactName = blankToNull(parsed.data.contact_name);
  const payloadHash = customRequestHash({
    kind: parsed.data.kind,
    productId: parsed.data.product_id ?? null,
    description: parsed.data.description,
    contactName,
    contactPhone: parsed.data.contact_phone,
    hasImage: hasFile,
  });

  try {
    const existing = await findCustomRequestByKey(parsed.data.idempotency_key);
    if (duplicateDecision(existing?.payload_hash ?? null, payloadHash) === "replay" && existing) {
      return jsonData({ id: existing.id, received: true });
    }
    if (existing) return jsonError("This submission does not match the earlier request.", 409);

    if (!allowAttempt(`custom:${clientAddress(request)}:${parsed.data.contact_phone}`, 5, 60 * 60 * 1000)) {
      return jsonError("Too many requests. Try again later.", 429);
    }

    if (parsed.data.kind === "EXISTING_MODEL") {
      if (!parsed.data.product_id || !isRecordId(parsed.data.product_id)) {
        return jsonError("Choose a catalog piece to modify.", 400);
      }
      const product = await prisma.product.findFirst({
        where: { id: parsed.data.product_id, is_visible: true, status: "ACTIVE" },
        select: { id: true },
      });
      if (!product) return jsonError("That catalog piece is not available.", 400);
    }

    let referenceFile: string | null = null;
    if (hasFile && file instanceof Blob) {
      try {
        const encoded = await encodeProductImage(Buffer.from(await file.arrayBuffer()));
        referenceFile = await storeRequestImage(encoded.data);
      } catch (error) {
        if (error instanceof ImageRejected) return jsonError(error.message, 400);
        throw error;
      }
    }

    try {
      const saved = await saveCustomRequest({
        fields: parsed.data,
        contactName,
        productId: parsed.data.product_id ?? null,
        payloadHash,
        referenceFile,
      });
      if (saved.replay && referenceFile) {
        await removeRequestImageFile(referenceFile).catch(() => undefined);
      }
      return jsonData({ id: saved.id, received: true }, saved.replay ? 200 : 201);
    } catch (error) {
      if (referenceFile) await removeRequestImageFile(referenceFile).catch(() => undefined);
      if (error instanceof CustomRequestConflict) {
        return jsonError("This submission does not match the earlier request.", 409);
      }
      throw error;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.name : "custom request failed");
    return jsonError("Request failed.", 500);
  }
}
