"use client";

import { FormEvent, useState } from "react";

const fieldClass =
  "mt-2 w-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const response = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string; ok?: boolean } | null;
    setPending(false);

    if (!response.ok) {
      setMessage(data?.message ?? "Password was not changed.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Password updated.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4">
      <label className="block text-xs font-semibold tracking-[0.16em] uppercase">
        Current password
        <input
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          className={fieldClass}
          required
        />
      </label>
      <label className="block text-xs font-semibold tracking-[0.16em] uppercase">
        New password
        <input
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
          className={fieldClass}
          required
        />
      </label>
      <label className="block text-xs font-semibold tracking-[0.16em] uppercase">
        Confirm password
        <input
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
          className={fieldClass}
          required
        />
      </label>
      <p className="text-sm text-[var(--muted)]">
        Use at least 10 characters with an uppercase letter, a lowercase letter, and a digit.
      </p>
      {message ? <p className="text-sm">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="border border-[var(--ink)] px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase disabled:opacity-50"
      >
        {pending ? "Updating" : "Update password"}
      </button>
    </form>
  );
}
