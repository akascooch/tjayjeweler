import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "tjay_session";
export const SESSION_MAX_AGE = 60 * 60 * 12;

export type SessionRole = "ADMIN" | "CUSTOMER";

export type SessionToken = {
  sub: string;
  role: SessionRole;
  name: string | null;
  phone: string | null;
  ver: number;
  iat: number;
  exp: number;
};

function secretKey() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) return null;
  return new TextEncoder().encode(value);
}

export async function signSession(input: {
  sub: string;
  role: SessionRole;
  name: string | null;
  phone: string | null;
  ver: number;
}) {
  const key = secretKey();
  if (!key) return null;

  return new SignJWT({
    role: input.role,
    name: input.name,
    phone: input.phone,
    ver: input.ver,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

export async function readSessionToken(token: string): Promise<SessionToken | null> {
  const key = secretKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER") return null;
    if (typeof payload.iat !== "number" || typeof payload.exp !== "number") return null;
    if (typeof payload.ver !== "number") return null;

    return {
      sub: payload.sub,
      role: payload.role,
      name: typeof payload.name === "string" ? payload.name : null,
      phone: typeof payload.phone === "string" ? payload.phone : null,
      ver: payload.ver,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
