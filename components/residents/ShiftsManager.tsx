"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { add24hr, remove24hr } from "@/app/(app)/residents/actions";
import { ResidentSelect, type ResidentOption } from "@/components/ui/ResidentSelect";
import { formatShort, formatShortDow, toISODate, addDays } from "@/lib/utils/date";
import { CALL_TYPE_LABELS, type CallType } from "@/types";

const CALL_OPTIONS = (Object.keys(CALL_TYPE_LABELS) as CallType[]).map((c) => ({
  id: c,
  name: CALL_TYPE_LABELS[c],
}));

export interface UpcomingShift {
  id: string;
  residentId: string;
  residentName: string;
  date: string;
  callType: CallType;
}

// Sunday-start week key for a date.
function weekStartISO(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - dt.getDay());
  return toISODate(dt);
}

// Group shifts (already sorted by date) into consecutive weeks.
function groupByWeek(items: UpcomingShift[]): { week: string; items: UpcomingShift[] }[] {
  const groups: { week: string; items: UpcomingShift[] }[] = [];
  for (const s of items) {
    const wk = weekStartISO(s.date);
    const last = groups[groups.length - 1];
    if (last && last.week === wk) last.items.push(s);
    else groups.push({ week: wk, items: [s] });
  }
  return groups;
}

export function ShiftsManager({
  residents,
  shifts,
}: {
  residents: ResidentOption[];
  shifts: UpcomingShift[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [residentId, setResidentId] = useState("");
  const [date, setDate] = useState(toISODate());
  const [callType, setCallType] = useState<CallType>("call_1");
  const [pending, startTransition] = useTransition();

  const preview = shifts.slice(0, 5);

  function add() {
    if (!residentId) return;
    startTransition(async () => {
      await add24hr(residentId, date, callType);
      router.refresh();
    });
  }

  function remove(s: UpcomingShift) {
    if (!confirm(`Remove the 24-hour shift for ${s.residentName} on ${formatShortDow(s.date)}?`)) {
      return;
    }
    startTransition(async () => {
      await remove24hr(s.id, s.residentId);
      router.refresh();
    });
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          24-Hour Shifts
        </h2>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Edit
        </button>
      </div>

      <div className="rounded-xl bg-white p-3 shadow-sm">
        {preview.length === 0 ? (
          <p className="text-sm text-slate-400">No upcoming shifts.</p>
        ) : (
          <>
            <ul className="space-y-1.5">
              {preview.map((s) => (
                <li key={s.id} className="flex items-baseline gap-2 text-sm">
                  <span className="shrink-0 font-medium text-slate-800">{formatShortDow(s.date)}</span>
                  <span className="text-slate-600">{s.residentName}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {CALL_TYPE_LABELS[s.callType]}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowAll(true)}
              className="mt-2 w-full rounded-lg border border-slate-200 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              Show all
            </button>
          </>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-sm flex-col gap-4 rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">24-Hour Shifts</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <ResidentSelect options={residents} value={residentId} onChange={setResidentId} />
              <ResidentSelect
                options={CALL_OPTIONS}
                value={callType}
                onChange={(id) => setCallType(id as CallType)}
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
                <button
                  onClick={add}
                  disabled={pending || !residentId}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Day before is pre-call · day after is post-call (off).
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              {shifts.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming shifts.</p>
              ) : (
                groupByWeek(shifts).map((g) => (
                  <div key={g.week}>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Week of {formatShort(g.week)}
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {g.items.map((s) => (
                        <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                          <span className="flex flex-wrap items-baseline gap-2">
                            <span className="font-medium text-slate-800">{formatShortDow(s.date)}</span>
                            <span className="text-slate-600">{s.residentName}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                              {CALL_TYPE_LABELS[s.callType]}
                            </span>
                            <span className="text-xs text-slate-400">
                              pre {formatShort(addDays(s.date, -1))} · post {formatShort(addDays(s.date, 1))}
                            </span>
                          </span>
                          <button
                            onClick={() => remove(s)}
                            disabled={pending}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            aria-label="Remove"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setShowAll(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-sm flex-col gap-3 rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">24-Hour Shifts</h2>
              <button onClick={() => setShowAll(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              {shifts.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming shifts.</p>
              ) : (
                groupByWeek(shifts).map((g) => (
                  <div key={g.week}>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Week of {formatShort(g.week)}
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {g.items.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-baseline gap-2 py-2 text-sm">
                          <span className="shrink-0 font-medium text-slate-800">{formatShortDow(s.date)}</span>
                          <span className="text-slate-600">{s.residentName}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            {CALL_TYPE_LABELS[s.callType]}
                          </span>
                          <span className="text-xs text-slate-400">
                            pre {formatShort(addDays(s.date, -1))} · post {formatShort(addDays(s.date, 1))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
