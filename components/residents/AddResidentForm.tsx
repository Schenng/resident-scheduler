"use client";

import { useState, useTransition } from "react";
import { createResident } from "@/app/(app)/residents/actions";
import { ResidentSelect } from "@/components/ui/ResidentSelect";

const LEVEL_OPTIONS = ["PGY-1", "PGY-2", "PGY-3", "PGY-4"].map((l) => ({ id: l, name: l }));

export function AddResidentForm() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [level, setLevel] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const valid = firstName.trim() !== "" && lastName.trim() !== "";

  function close() {
    setOpen(false);
    setFirstName("");
    setLastName("");
    setLevel("");
    setError(null);
  }

  function submit() {
    if (!valid) return;
    setError(null);
    startTransition(async () => {
      try {
        await createResident(firstName, lastName, level);
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add resident");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Add
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-sm space-y-3 rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Add resident</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <input
              autoFocus
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
            <input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
            <ResidentSelect
              options={LEVEL_OPTIONS}
              value={level}
              onChange={setLevel}
              placeholder="Level"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={pending || !valid}
                className="flex-1 rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {pending ? "Adding…" : "Add"}
              </button>
              <button
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
