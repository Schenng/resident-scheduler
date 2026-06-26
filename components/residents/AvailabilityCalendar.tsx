"use client";

import { useState, useTransition } from "react";
import { addAvailability, removeAvailability } from "@/app/(app)/residents/actions";
import { formatShort, toISODate } from "@/lib/utils/date";
import type { AvailabilityType, ResidentAvailability } from "@/types";

const TYPE_LABELS: Record<AvailabilityType, string> = {
  vacation: "Vacation",
  sick: "Sick",
  leave: "Leave",
};

export function AvailabilityCalendar({
  residentId,
  entries,
  conflictDates,
}: {
  residentId: string;
  entries: ResidentAvailability[];
  conflictDates: string[];
}) {
  const today = toISODate();
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [type, setType] = useState<AvailabilityType>("vacation");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      await addAvailability(residentId, start, end, type, note);
      setNote("");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await removeAvailability(id, residentId);
    });
  }

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Vacation / Sick / Leave</h2>
      <p className="text-xs text-slate-500">
        Any covered date marks the resident <strong>Off</strong> (unassignable).
      </p>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-500">
          From
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-500"
          />
        </label>
        <label className="text-xs text-slate-500">
          To
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-500"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AvailabilityType)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-500"
        >
          <option value="vacation">Vacation</option>
          <option value="sick">Sick</option>
          <option value="leave">Leave</option>
        </select>
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-500"
        />
      </div>
      <button
        onClick={add}
        disabled={pending}
        className="w-full rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        Add time off
      </button>

      {entries.length > 0 && (
        <ul className="divide-y divide-slate-100 pt-1">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span className="flex items-center gap-2">
                <span className="font-medium text-slate-800">{formatShort(e.date)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {TYPE_LABELS[e.type]}
                </span>
                {conflictDates.includes(e.date) && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    overrides 24h
                  </span>
                )}
                {e.note && <span className="text-slate-400">{e.note}</span>}
              </span>
              <button
                onClick={() => remove(e.id)}
                className="text-slate-300 hover:text-red-500"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
