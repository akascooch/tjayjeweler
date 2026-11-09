import { jsonData } from "@/lib/admin";
import { assertSameOrigin, clientAddress } from "@/lib/csrf";
import { jsonError } from "@/lib/http";
import {
  encodeProductImage,
  ImageRejected,
  MAX_UPLOAD_BYTES,
  removeReceiptImageFile,
  storeReceiptImage,
} from "@/lib/media";
import { createCardTransferOrder } from "@/lib/orders";
import { orderContactSchema } from "@/lib/orders-schema";
import { allowAttempt } from "@/lib/rate-limit";
import { getPublicBankSettings } from "@/lib/store-settings";
import { firstZodMessage } from "@/lib/validators";
import { z } from "zod";

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

  const bank = await getPublicBankSettings();
  if (!bank.configured) {
    return jsonError("Card transfer is not configured yet. Please try again later.", 503);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return jsonError("Send the order as multipart form data with a receipt image.", 415);
  }

  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) return jsonError("Content length is required.", 411);
  if (length > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
    return jsonError("Receipts can be at most 15 MB.", 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("The request could not be read.", 400);
  }

  let items: unknown = [];
  try {
    items = JSON.parse(textField(form, "items") ?? "[]");
  } catch {
    return jsonError("Bag items are invalid.", 400);
  }

  const parsed = orderContactSchema.safeParse({
    email: textField(form, "email") ?? "",
    phone: textField(form, "phone") ?? "",
    items,
  });
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  if (!allowAttempt(`orders:${clientAddress(request)}:${parsed.data.phone}`, 8, 60 * 60 * 1000)) {
    return jsonError("Too many orders. Try again later.", 429);
  }

  const file = form.get("receipt");
  if (!(file instanceof Blob) || file.size <= 0) {
    return jsonError("Upload a payment receipt image.", 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonError("Receipts can be at most 15 MB.", 413);
  }

  let receiptImage: string | null = null;
  try {
    const encoded = await encodeProductImage(Buffer.from(await file.arrayBuffer()));
    receiptImage = await storeReceiptImage(encoded.data);

    const result = await createCardTransferOrder({
      ...parsed.data,
      receiptImage,
    });
    if (!result.ok) {
      await removeReceiptImageFile(receiptImage).catch(() => undefined);
      return jsonError(result.message, result.status);
    }

    return jsonData(
      {
        orderId: result.orderId,
        status: result.status,
        amountIrt: result.amountIrt,
      },
      201,
    );
  } catch (error) {
    if (receiptImage) await removeReceiptImageFile(receiptImage).catch(() => undefined);
    if (error instanceof ImageRejected) return jsonError(error.message, 400);
    if (error instanceof z.ZodError) return jsonError(firstZodMessage(error), 400);
    console.error(error instanceof Error ? error.name : "order create failed");
    return jsonError("Order failed.", 500);
  }
}
