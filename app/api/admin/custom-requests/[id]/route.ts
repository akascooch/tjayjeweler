import { isRecordId, jsonData, prismaError, requireAdmin } from "@/lib/admin";
import { customRequestReviewSchema } from "@/lib/custom-request";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { blankToNull, firstZodMessage } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  if (!isRecordId(id)) return jsonError("Request not found.", 404);

  const parsed = customRequestReviewSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  try {
    const updated = await prisma.customRequest.update({
      where: { id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.staff_note !== undefined ? { staff_note: blankToNull(parsed.data.staff_note) } : {}),
      },
      select: { id: true, status: true },
    });
    return jsonData(updated);
  } catch (error) {
    const known = prismaError(error, "Request not found.");
    if (known) return known;
    console.error(error instanceof Error ? error.name : "custom request review failed");
    return jsonError("Request failed.", 500);
  }
}
