import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio · TJAY JEWELER",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/account");
  }

  return (
    <main className="px-6 py-12 md:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.28em] text-[var(--muted)] uppercase">
            TJAY Studio
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[0.12em] uppercase">Admin</h1>
        </div>
        <LogoutButton />
      </div>
      <AdminNav />
      <div className="py-8">{children}</div>
    </main>
  );
}
