import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { requireAdmin } from "@/lib/admin";
import { staffRequestAccess } from "@/lib/custom-request";
import { prisma } from "@/lib/db";
import { requestMediaPath } from "@/lib/media";
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
  const deniedStatus = staffRequestAccess(auth.user.role);
  if (deniedStatus) return denied(deniedStatus);

  const { id } = await context.params;
  const record = await prisma.customRequest.findUnique({
    where: { id },
    select: { reference_file: true },
  });
  const file = record?.reference_file;
  if (!file || !productMediaFilePattern.test(file)) return new Response("Not found", { status: 404 });

  let size: number;
  try {
    const info = await stat(requestMediaPath(file));
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    size = info.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const body = Readable.toWeb(createReadStream(requestMediaPath(file))) as ReadableStream<Uint8Array>;
  return new Response(body, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
