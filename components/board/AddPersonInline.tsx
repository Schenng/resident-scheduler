"use client";

import { useEffect, useState } from "react";
import type { PersonType } from "@/types";
import { ResidentSelect, type ResidentOption } from "@/components/ui/ResidentSelect";

/**
 * Pop-up to add an attending, CRNA, or resident to a room. Controlled by the
 * parent: opened by clicking a room name, not by an inline button.
 */
export function AddPersonInline({
  open,
  roomLabel,
  residents,
  onAdd,
  onClose,
}: {
  open: boolean;
  roomLabel: string;
  residents: ResidentOption[];
  onAdd: (input: { type: PersonType; name: string; residentId?: string }) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<PersonType>("attending");
  const [name, setName] = useState("");
  const [residentId, setResidentId] = useState("");

  // Reset the form each time the pop-up opens.
  useEffect(() => {
    if (open) {
      setType("attending");
      setName("");
      setResidentId("");
    }
  }, [open]);

  if (!open) return null;

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
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-xs space-y-4 rounded-xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-slate-900">Add to {roomLabel}</h2>

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
            <ResidentSelect
              options={residents}
              value={residentId}
              onChange={setResidentId}
            />
          )
        ) : (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") onClose();
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
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
