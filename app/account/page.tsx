import Link from "next/link";
import { LoginPanel } from "./login-panel";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/admin")) return null;
  if (value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const nextPath = safeNext((await searchParams).next);

  return (
    <main className="px-6 py-16 md:px-12">
      <p className="editorial-heading text-xs font-semibold tracking-[0.28em] text-[var(--muted)] uppercase">
        Account
      </p>
      <h1 className="editorial-heading mt-3 text-4xl font-black tracking-[0.14em] uppercase">
        {user ? user.name || "Member" : "Sign in"}
      </h1>
      {user ? (
        <div className="mx-auto mt-8 max-w-md">
          <p className="text-sm tracking-wide text-[var(--muted)]">
            {user.phone} · {user.role === "ADMIN" ? "Admin" : "Customer"}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {user.role === "ADMIN" ? (
              <Link
                href={nextPath ?? "/admin"}
                className="border border-[var(--ink)] px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase"
              >
                Open studio
              </Link>
            ) : null}
            <LogoutButton />
          </div>
        </div>
      ) : (
        <>
          <p className="editorial-lede mt-6 max-w-xl text-sm tracking-wide text-[var(--muted)]">
            Sign in with an existing studio phone number and password.
          </p>
          <div className="mx-auto max-w-md">
            <LoginPanel nextPath={nextPath} />
          </div>
        </>
      )}
    </main>
  );
}
