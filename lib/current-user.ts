import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await readSessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      password_hash: true,
      updated_at: true,
    },
  });

  if (!user?.password_hash) return null;
  if (user.role !== session.role) return null;
  if (session.ver !== user.updated_at.getTime()) return null;

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}
