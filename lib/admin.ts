import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { assertSameOrigin } from "@/lib/csrf";
import { jsonError } from "@/lib/http";

export function isRecordId(id: string) {
  return /^c[a-z0-9]{20,32}$/i.test(id);
}

export function jsonData(body: unknown, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function requireAdmin(request?: Request) {
  if (request && !assertSameOrigin(request)) {
    return { error: jsonError("Cross-site request blocked.", 403) };
  }

  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Sign in required.", 401) };
  if (user.role !== "ADMIN") return { error: jsonError("Admin access required.", 403) };
  return { user };
}

export function prismaError(error: unknown, notFound: string) {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  if (error.code === "P2002") return jsonError("That value is already in use.", 409);
  if (error.code === "P2025") return jsonError(notFound, 404);
  if (error.code === "P2003") return jsonError("The related record does not exist.", 400);
  return null;
}
