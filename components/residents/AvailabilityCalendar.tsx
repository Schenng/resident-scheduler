"use client";

import { useState, useTransition } from "react";
import { removeAvailability } from "@/app/(app)/residents/actions";
import { formatShort } from "@/lib/utils/date";
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
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const LIMIT = 5;
  const visible = expanded ? entries : entries.slice(0, LIMIT);

  function remove(id: string, date: string, type: AvailabilityType) {
    if (!confirm(`Remove the ${TYPE_LABELS[type]} on ${formatShort(date)}?`)) return;
    startTransition(async () => {
      await removeAvailability(id, residentId);
    });
  }

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Vacation / Sick / Leave</h2>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">No time off.</p>
      ) : (
        <ul className="divide-y divide-slate-100 pt-1">
          {visible.map((e) => (
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
                onClick={() => remove(e.id, e.date, e.type)}
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

      {entries.length > LIMIT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full rounded-lg border border-slate-200 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          {expanded ? "Show less" : `Show all (${entries.length})`}
        </button>
      )}
    </section>
  );
}
