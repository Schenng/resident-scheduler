"use client";

import { useState, useTransition } from "react";
import { addRotation, removeRotation } from "@/app/(app)/residents/actions";
import { formatShort, toISODate } from "@/lib/utils/date";
import type { ResidentRotation } from "@/types";

export function RotationList({
  residentId,
  entries,
}: {
  residentId: string;
  entries: ResidentRotation[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState(toISODate());
  const [end, setEnd] = useState(toISODate());
  const [pending, startTransition] = useTransition();

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      await addRotation(residentId, name, start, end);
      setName("");
      setOpen(false);
    });
  }

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Rotation Schedule</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
          not used in scheduling yet
        </span>
      </div>

      {entries.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <span className="font-medium text-slate-800">{e.rotation_name}</span>
                <span className="ml-2 text-slate-400">
                  {formatShort(e.start_date)} – {formatShort(e.end_date)}
                </span>
              </span>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await removeRotation(e.id, residentId);
                  })
                }
                className="text-slate-300 hover:text-red-500"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="space-y-2">
          <input
            placeholder="Rotation (e.g. Cardiac)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-500"
            />
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={pending || !name.trim()}
              className="flex-1 rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Add rotation
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          + Add rotation
        </button>
      )}
    </section>
  );
}
