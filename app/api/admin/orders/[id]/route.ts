import { isRecordId, jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import { reviewCardTransferOrder } from "@/lib/orders";
import { orderReviewSchema } from "@/lib/orders-schema";
import { firstZodMessage } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Order not found.", 404);

  const parsed = orderReviewSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  try {
    const result = await reviewCardTransferOrder(id, parsed.data);
    if (!result.ok) return jsonError(result.message, result.status);
    return jsonData({ id: result.orderId, status: result.status });
  } catch (error) {
    const known = prismaError(error, "Order not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "order review failed");
    return jsonError("Order review failed.", 500);
  }
}
