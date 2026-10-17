"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const fieldClass =
  "mt-2 w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm outline-none";

export function LoginPanel({ nextPath }: { nextPath: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [googleMessage, setGoogleMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = (await response.json().catch(() => null)) as {
      message?: string;
      role?: string;
    } | null;
    setPending(false);

    if (!response.ok) {
      setMessage(data?.message ?? "Sign-in failed.");
      return;
    }

    if (data?.role === "ADMIN" && nextPath?.startsWith("/admin")) {
      router.push(nextPath);
      return;
    }

    router.refresh();
  }

  async function onGoogle() {
    setGoogleMessage("");
    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    setGoogleMessage(data?.message ?? "Google sign-in is not configured.");
  }

  return (
    <div className="mt-10 max-w-md">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-xs font-semibold tracking-[0.16em] uppercase">
          Phone
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            autoComplete="username"
            className={fieldClass}
            required
          />
        </label>
        <label className="block text-xs font-semibold tracking-[0.16em] uppercase">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            className={fieldClass}
            required
          />
        </label>
        {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="border border-[var(--ink)] px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase disabled:opacity-50"
        >
          {pending ? "Signing in" : "Sign in"}
        </button>
      </form>
      <button
        type="button"
        onClick={onGoogle}
        className="mt-6 border border-[var(--line)] px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase"
      >
        Continue with Google
      </button>
      {googleMessage ? <p className="mt-3 text-sm text-[var(--muted)]">{googleMessage}</p> : null}
    </div>
  );
}
