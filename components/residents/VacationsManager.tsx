"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addAvailability, removeAvailabilityRange } from "@/app/(app)/residents/actions";
import { ResidentSelect, type ResidentOption } from "@/components/ui/ResidentSelect";
import { formatShortDow, toISODate } from "@/lib/utils/date";
import type { AvailabilityType } from "@/types";

const TYPE_LABELS: Record<AvailabilityType, string> = {
  vacation: "Vacation",
  sick: "Sick",
  leave: "Leave",
};

const TYPE_OPTIONS = (["vacation", "sick", "leave"] as AvailabilityType[]).map((t) => ({
  id: t,
  name: TYPE_LABELS[t],
}));

export interface UpcomingTimeOff {
  residentId: string;
  residentName: string;
  type: AvailabilityType;
  start: string;
  end: string;
}

function formatRange(start: string, end: string): string {
  return start === end ? formatShortDow(start) : `${formatShortDow(start)} – ${formatShortDow(end)}`;
}

// Sunday-start week key for a date.
function weekStartISO(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - dt.getDay());
  return toISODate(dt);
}

// Group time off (sorted by start) into consecutive weeks (by start date).
function groupByWeek(items: UpcomingTimeOff[]): { week: string; items: UpcomingTimeOff[] }[] {
  const groups: { week: string; items: UpcomingTimeOff[] }[] = [];
  for (const r of items) {
    const wk = weekStartISO(r.start);
    const last = groups[groups.length - 1];
    if (last && last.week === wk) last.items.push(r);
    else groups.push({ week: wk, items: [r] });
  }
  return groups;
}

// Combine residents who share the exact same date range under one heading.
function groupByRange(
  items: UpcomingTimeOff[]
): { start: string; end: string; items: UpcomingTimeOff[] }[] {
  const groups: { start: string; end: string; items: UpcomingTimeOff[] }[] = [];
  for (const r of items) {
    const last = groups[groups.length - 1];
    if (last && last.start === r.start && last.end === r.end) last.items.push(r);
    else groups.push({ start: r.start, end: r.end, items: [r] });
  }
  for (const g of groups) g.items.sort((a, b) => a.residentName.localeCompare(b.residentName));
  return groups;
}

export function VacationsManager({
  residents,
  ranges,
}: {
  residents: ResidentOption[];
  ranges: UpcomingTimeOff[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const today = toISODate();
  const [residentId, setResidentId] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [type, setType] = useState<AvailabilityType>("vacation");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const rangeGroups = groupByRange(ranges);
  const previewGroups = rangeGroups.slice(0, 3);

  function add() {
    if (!residentId) return;
    startTransition(async () => {
      await addAvailability(residentId, start, end, type, note);
      setNote("");
      router.refresh();
    });
  }

  function remove(r: UpcomingTimeOff) {
    if (
      !confirm(
        `Remove ${r.residentName}'s ${TYPE_LABELS[r.type]} (${formatRange(r.start, r.end)})?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      await removeAvailabilityRange(r.residentId, r.start, r.end);
      router.refresh();
    });
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vacations</h2>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Edit
        </button>
      </div>

      <div className="rounded-xl bg-white p-3 shadow-sm">
        {previewGroups.length === 0 ? (
          <p className="text-sm text-slate-400">No upcoming time off.</p>
        ) : (
          <>
            <div className="space-y-2">
              {previewGroups.map((g) => (
                <div key={`${g.start}-${g.end}`}>
                  <div className="text-sm font-medium text-slate-800">
                    {formatRange(g.start, g.end)}
                  </div>
                  <ul className="mt-0.5 space-y-0.5 pl-3">
                    {g.items.map((r) => (
                      <li key={`${r.residentId}-${r.type}`} className="flex items-baseline gap-2 text-sm">
                        <span className="text-slate-600">{r.residentName}</span>
                        {r.type !== "vacation" && (
                          <span className="text-xs text-slate-400">{TYPE_LABELS[r.type]}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
              <h2 className="font-semibold text-slate-900">Vacations</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <ResidentSelect options={residents} value={residentId} onChange={setResidentId} />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-500">
                  From
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  To
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />
                </label>
              </div>
              <ResidentSelect
                options={TYPE_OPTIONS}
                value={type}
                onChange={(id) => setType(id as AvailabilityType)}
              />
              <input
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
              <button
                onClick={add}
                disabled={pending || !residentId}
                className="w-full rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                Add time off
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              {ranges.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming time off.</p>
              ) : (
                groupByWeek(ranges).map((wk) => (
                  <div key={wk.week} className="space-y-2">
                    {groupByRange(wk.items).map((g) => (
                      <div key={`${g.start}-${g.end}`}>
                        <div className="text-sm font-medium text-slate-800">
                          {formatRange(g.start, g.end)}
                        </div>
                        <ul className="mt-0.5 pl-3">
                          {g.items.map((r) => (
                            <li
                              key={`${r.residentId}-${r.type}`}
                              className="flex items-center justify-between py-1 text-sm"
                            >
                              <span className="flex items-baseline gap-2">
                                <span className="text-slate-700">{r.residentName}</span>
                                {r.type !== "vacation" && (
                                  <span className="text-xs text-slate-400">{TYPE_LABELS[r.type]}</span>
                                )}
                              </span>
                              <button
                                onClick={() => remove(r)}
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
                    ))}
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
              <h2 className="font-semibold text-slate-900">Vacations</h2>
              <button onClick={() => setShowAll(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              {ranges.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming time off.</p>
              ) : (
                groupByWeek(ranges).map((wk) => (
                  <div key={wk.week} className="space-y-2">
                    {groupByRange(wk.items).map((g) => (
                      <div key={`${g.start}-${g.end}`}>
                        <div className="text-sm font-medium text-slate-800">
                          {formatRange(g.start, g.end)}
                        </div>
                        <ul className="mt-0.5 pl-3">
                          {g.items.map((r) => (
                            <li
                              key={`${r.residentId}-${r.type}`}
                              className="flex items-baseline gap-2 py-1 text-sm"
                            >
                              <span className="text-slate-700">{r.residentName}</span>
                              {r.type !== "vacation" && (
                                <span className="text-xs text-slate-400">{TYPE_LABELS[r.type]}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
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
