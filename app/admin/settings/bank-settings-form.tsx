"use client";

import { FormEvent, useState } from "react";
import { formatCardNumber } from "@/lib/store-settings-schema";

const fieldClass =
  "mt-2 w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm outline-none";

export function BankSettingsForm({
  initial,
}: {
  initial: {
    bank_card_number: string;
    bank_card_holder: string;
    bank_name: string;
  };
}) {
  const [cardNumber, setCardNumber] = useState(formatCardNumber(initial.bank_card_number));
  const [holder, setHolder] = useState(initial.bank_card_holder);
  const [bankName, setBankName] = useState(initial.bank_name);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bank_card_number: cardNumber.replace(/\D/g, ""),
        bank_card_holder: holder,
        bank_name: bankName,
      }),
    });
    const data = (await response.json().catch(() => null)) as
      | {
          message?: string;
          bank_card_number?: string;
          bank_card_holder?: string;
          bank_name?: string;
        }
      | null;
    setPending(false);

    if (!response.ok) {
      setMessage(data?.message ?? "Card settings were not saved.");
      return;
    }

    if (data?.bank_card_number) setCardNumber(formatCardNumber(data.bank_card_number));
    if (data?.bank_card_holder) setHolder(data.bank_card_holder);
    if (data?.bank_name) setBankName(data.bank_name);
    setMessage("Card settings updated.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4 border border-[var(--line)] p-5">
      <h3 className="text-sm font-semibold tracking-[0.16em] uppercase">Card-to-card details</h3>
      <p className="text-sm text-[var(--muted)]">
        These details are shown at checkout for customers transferring payment.
      </p>
      <label className="block text-xs font-semibold tracking-[0.16em] uppercase">
        Bank name
        <input
          value={bankName}
          onChange={(event) => setBankName(event.target.value)}
          className={fieldClass}
          maxLength={120}
          required
        />
      </label>
      <label className="block text-xs font-semibold tracking-[0.16em] uppercase">
        Account holder
        <input
          value={holder}
          onChange={(event) => setHolder(event.target.value)}
          className={fieldClass}
          maxLength={120}
          required
        />
      </label>
      <label className="block text-xs font-semibold tracking-[0.16em] uppercase">
        Card number
        <input
          value={cardNumber}
          onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
          inputMode="numeric"
          autoComplete="off"
          className={fieldClass}
          required
        />
      </label>
      {message ? <p className="text-sm">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="border border-[var(--ink)] px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase disabled:opacity-50"
      >
        {pending ? "Saving" : "Save card details"}
      </button>
    </form>
  );
}
