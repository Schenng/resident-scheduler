"use client";

import { useState } from "react";
import type { PersonType } from "@/types";

interface ResidentOption {
  id: string;
  name: string;
}

/** "+ add" control inside a room. Opens a pop-up to add an attending, CRNA, or resident. */
export function AddPersonInline({
  residents,
  onAdd,
}: {
  residents: ResidentOption[];
  onAdd: (input: { type: PersonType; name: string; residentId?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PersonType>("attending");
  const [name, setName] = useState("");
  const [residentId, setResidentId] = useState("");

  function close() {
    setOpen(false);
    setType("attending");
    setName("");
    setResidentId("");
  }

  const canAdd = type === "resident" ? residentId !== "" : name.trim() !== "";

  function submit() {
    if (!canAdd) return;
    if (type === "resident") {
      const r = residents.find((x) => x.id === residentId);
      if (!r) return;
      onAdd({ type: "resident", name: r.name, residentId: r.id });
    } else {
      onAdd({ type, name: name.trim() });
    }
    close();
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400 hover:border-slate-400 hover:text-slate-600"
      >
        + add
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
        >
          <div
            className="w-full max-w-xs space-y-4 rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-slate-900">Add person</h2>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(["attending", "crna", "resident"] as const).map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="person-type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                  />
                  {t === "crna" ? "CRNA" : t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>

            {type === "resident" ? (
              residents.length === 0 ? (
                <p className="text-sm text-slate-400">No available residents.</p>
              ) : (
                <select
                  autoFocus
                  value={residentId}
                  onChange={(e) => setResidentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">Select a resident…</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                  if (e.key === "Escape") close();
                }}
                placeholder="Name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={!canAdd}
                className="flex-1 rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={close}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
