import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { assertSameOrigin, clientAddress } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { allowAttempt } from "@/lib/rate-limit";
import { sessionCookie, signSession } from "@/lib/session";
import { changePasswordSchema, firstZodMessage } from "@/lib/validators";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Cross-site request blocked.", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required.", 401);
  if (user.role !== "ADMIN") return jsonError("Admin access required.", 403);

  if (!allowAttempt(`password:${user.id}:${clientAddress(request)}`, 5, 15 * 60 * 1000)) {
    return jsonError("Too many attempts. Try again later.", 429);
  }

  const parsed = changePasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(firstZodMessage(parsed.error), 400);
  }

  try {
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password_hash: true, role: true, name: true, phone: true },
    });

    if (!record?.password_hash || record.role !== "ADMIN") {
      return jsonError("Admin access required.", 403);
    }

    const currentMatches = await bcrypt.compare(
      parsed.data.current_password,
      record.password_hash,
    );
    if (!currentMatches) {
      return jsonError("Current password is incorrect.", 401);
    }

    const passwordHash = await bcrypt.hash(parsed.data.new_password, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: passwordHash },
      select: { id: true, name: true, phone: true, role: true, updated_at: true },
    });

    const token = await signSession({
      sub: updated.id,
      role: updated.role,
      name: updated.name,
      phone: updated.phone,
      ver: updated.updated_at.getTime(),
    });
    if (!token) return jsonError("Authentication is not configured.", 500);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie(token));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error(error instanceof Error ? error.name : "password change failed");
    return jsonError("Request failed.", 500);
  }
}
