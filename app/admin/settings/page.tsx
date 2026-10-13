import { PasswordForm } from "./password-form";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">Admin Settings</h2>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Signed in as {user?.name ?? "Admin"}
        {user?.phone ? ` · ${user.phone}` : ""}.
      </p>
      <PasswordForm />
    </section>
  );
}
