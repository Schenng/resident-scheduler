"use client";

import { useState, useTransition } from "react";
import { add24hr, remove24hr } from "@/app/(app)/residents/actions";
import { formatShort, toISODate, addDays } from "@/lib/utils/date";
import type { Resident24hr } from "@/types";

export function ShiftCalendar({
  residentId,
  entries,
  conflictDates,
}: {
  residentId: string;
  entries: Resident24hr[];
  conflictDates: string[];
}) {
  const [date, setDate] = useState(toISODate());
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      await add24hr(residentId, date);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await remove24hr(id, residentId);
    });
  }

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">24-Hour Shifts</h2>
      <p className="text-xs text-slate-500">
        The day before is <strong>Pre-call</strong>, the day itself is{" "}
        <strong>24</strong>, the day after is <strong>Post-call</strong> (off).
      </p>

      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-500"
        />
        <button
          onClick={add}
          disabled={pending}
          className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {entries.length > 0 && (
        <ul className="divide-y divide-slate-100 pt-1">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">{formatShort(e.date)}</span>
                <span className="text-xs text-slate-400">
                  pre-call {formatShort(addDays(e.date, -1))} · post-call{" "}
                  {formatShort(addDays(e.date, 1))}
                </span>
                {conflictDates.includes(e.date) && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    overridden by time off
                  </span>
                )}
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
