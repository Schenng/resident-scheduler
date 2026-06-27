"use client";

import { useTransition } from "react";
import { remove24hr } from "@/app/(app)/residents/actions";
import { formatShort, addDays } from "@/lib/utils/date";
import { CALL_TYPE_LABELS, type Resident24hr } from "@/types";

export function ShiftCalendar({
  residentId,
  entries,
  conflictDates,
}: {
  residentId: string;
  entries: Resident24hr[];
  conflictDates: string[];
}) {
  const [pending, startTransition] = useTransition();

  function remove(id: string, date: string) {
    if (!confirm(`Remove the 24-hour shift on ${formatShort(date)}?`)) return;
    startTransition(async () => {
      await remove24hr(id, residentId);
    });
  }

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">24-Hour Shifts</h2>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">No 24-hour shifts.</p>
      ) : (
        <ul className="divide-y divide-slate-100 pt-1">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">{formatShort(e.date)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {CALL_TYPE_LABELS[e.call_type]}
                </span>
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
                onClick={() => remove(e.id, e.date)}
                disabled={pending}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
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
