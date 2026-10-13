import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { assertSameOrigin, clientAddress } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { allowAttempt } from "@/lib/rate-limit";
import { sessionCookie, signSession } from "@/lib/session";
import { loginSchema } from "@/lib/validators";

const DUMMY_PASSWORD_HASH = "$2b$10$61l4FX4kL2zd0Gl6x0uHTO1RTkOnXokyZL.uTJ7mTCPzFCtQRc0JW";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Cross-site request blocked.", 403);
  }

  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError("Enter a valid phone number and password.", 400);
  }

  const limitKey = `login:${clientAddress(request)}:${parsed.data.phone}`;
  if (!allowAttempt(limitKey, 8, 15 * 60 * 1000)) {
    return jsonError("Too many attempts. Try again later.", 429);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phone: parsed.data.phone },
    });
    const matches = await bcrypt.compare(
      parsed.data.password,
      user?.password_hash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user?.password_hash || !matches) {
      return jsonError("Invalid phone or password.", 401);
    }

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      ver: user.updated_at.getTime(),
    });
    if (!token) {
      return jsonError("Authentication is not configured.", 500);
    }

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    });
    response.cookies.set(sessionCookie(token));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error(error instanceof Error ? error.name : "login failed");
    return jsonError("Request failed.", 500);
  }
}
