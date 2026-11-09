import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { isRecordId, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { receiptMediaPath } from "@/lib/media";
import { productMediaFilePattern } from "@/lib/media-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function denied(status: number) {
  return new Response(status === 401 ? "Sign in required." : "Admin access required.", {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return denied(auth.error.status);
  if (!("user" in auth)) return denied(401);

  const { id } = await context.params;
  if (!isRecordId(id)) return new Response("Not found", { status: 404 });

  const record = await prisma.order.findUnique({
    where: { id },
    select: { receipt_image: true },
  });
  const file = record?.receipt_image;
  if (!file || !productMediaFilePattern.test(file)) return new Response("Not found", { status: 404 });

  let size: number;
  try {
    const info = await stat(receiptMediaPath(file));
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    size = info.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const body = Readable.toWeb(createReadStream(receiptMediaPath(file))) as ReadableStream<Uint8Array>;
  return new Response(body, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
