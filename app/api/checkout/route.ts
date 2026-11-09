import { createCheckoutSession } from "@/lib/checkout";
import { checkoutBodySchema } from "@/lib/checkout-schema";
import { assertSameOrigin, clientAddress } from "@/lib/csrf";
import { jsonData } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import { allowAttempt } from "@/lib/rate-limit";
import { firstZodMessage } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Cross-site request blocked.", 403);
  }

  if (!allowAttempt(`checkout:${clientAddress(request)}`, 20, 60 * 60 * 1000)) {
    return jsonError("Too many checkout attempts. Try again later.", 429);
  }

  const body = await readJson(request);
  if (!body) return jsonError("Send JSON checkout details.", 415);

  const parsed = checkoutBodySchema.safeParse(body);
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  try {
    const result = await createCheckoutSession(request, parsed.data);
    if (!result.ok) return jsonError(result.message, result.status);
    return jsonData({
      orderId: result.orderId,
      authority: result.authority,
      paymentUrl: result.paymentUrl,
      amountIrt: result.amountIrt,
      amountRial: result.amountRial,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.name : "checkout failed");
    return jsonError("Checkout failed.", 500);
  }
}
