import { BankSettingsForm } from "./bank-settings-form";
import { PasswordForm } from "./password-form";
import { getCurrentUser } from "@/lib/current-user";
import { getBankSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  const bank = await getBankSettings();

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">Admin Settings</h2>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Signed in as {user?.name ?? "Admin"}
        {user?.phone ? ` · ${user.phone}` : ""}.
      </p>
      <BankSettingsForm
        initial={{
          bank_card_number: bank.bank_card_number,
          bank_card_holder: bank.bank_card_holder,
          bank_name: bank.bank_name,
        }}
      />
      <PasswordForm />
    </section>
  );
}
