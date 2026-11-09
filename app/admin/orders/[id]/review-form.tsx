"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = ["PAYMENT_APPROVED", "PAYMENT_REJECTED", "PROCESSING", "COMPLETED"] as const;

export function OrderReviewForm({
  id,
  status,
  staffNote,
}: {
  id: string;
  status: string;
  staffNote: string | null;
}) {
  const router = useRouter();
  const initial = statuses.includes(status as (typeof statuses)[number])
    ? (status as (typeof statuses)[number])
    : "PAYMENT_APPROVED";
  const [nextStatus, setNextStatus] = useState<(typeof statuses)[number]>(initial);
  const [note, setNote] = useState(staffNote ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, staff_note: note }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setMessage(payload?.message ?? "The order could not be updated.");
        return;
      }
      setMessage("Saved.");
      router.refresh();
    } catch {
      setMessage("The order could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="mt-8 grid max-w-xl gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <label className="text-xs tracking-[0.16em] uppercase" htmlFor="order-status">
        Order status
      </label>
      <select
        id="order-status"
        value={nextStatus}
        onChange={(event) => setNextStatus(event.target.value as (typeof statuses)[number])}
        className="min-h-11 border border-[var(--line-strong)] bg-[var(--paper)] px-3"
      >
        <option value="PAYMENT_APPROVED">Payment approved</option>
        <option value="PAYMENT_REJECTED">Payment rejected</option>
        <option value="PROCESSING">Processing</option>
        <option value="COMPLETED">Completed</option>
      </select>
      <label className="text-xs tracking-[0.16em] uppercase" htmlFor="staff-note">
        Internal note
      </label>
      <textarea
        id="staff-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={2000}
        rows={5}
        className="border border-[var(--line-strong)] bg-[var(--paper)] p-3 text-sm leading-7"
      />
      <button
        type="submit"
        disabled={pending}
        className="font-ui min-h-11 justify-self-start border border-white px-4 text-xs tracking-[0.14em] uppercase disabled:opacity-50"
      >
        {pending ? "Saving" : "Save"}
      </button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
