"use client";

import { useState, useTransition } from "react";
import { createResident } from "@/app/(app)/residents/actions";

export function AddResidentForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [level, setLevel] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const valid = firstName.trim() !== "" && lastName.trim() !== "";

  function submit() {
    if (!valid) return;
    setError(null);
    startTransition(async () => {
      try {
        await createResident(firstName, lastName, level);
        setFirstName("");
        setLastName("");
        setLevel("");
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add resident");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
      >
        + Add resident
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <input
        autoFocus
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
      />
      <input
        placeholder="Last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
      />
      <input
        placeholder="Level (e.g. PGY-2)"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={pending || !valid}
          className="flex-1 rounded-lg bg-slate-800 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg px-4 py-2 text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
