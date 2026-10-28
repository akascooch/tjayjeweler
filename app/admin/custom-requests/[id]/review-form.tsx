"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm({
  id,
  status,
  staffNote,
}: {
  id: string;
  status: "NEW" | "REVIEWED" | "CLOSED";
  staffNote: string | null;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState(status);
  const [note, setNote] = useState(staffNote ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/custom-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, staff_note: note }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setMessage(payload?.message ?? "The note could not be saved.");
        return;
      }
      setMessage("Saved.");
      router.refresh();
    } catch {
      setMessage("The note could not be saved.");
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
      <label className="text-xs tracking-[0.16em] uppercase" htmlFor="request-status">
        Studio status
      </label>
      <select
        id="request-status"
        value={nextStatus}
        onChange={(event) => setNextStatus(event.target.value as typeof status)}
        className="min-h-11 border border-[var(--line-strong)] bg-[var(--paper)] px-3"
      >
        <option value="NEW">New</option>
        <option value="REVIEWED">Reviewed</option>
        <option value="CLOSED">Closed</option>
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
