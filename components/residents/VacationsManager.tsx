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

  const preview = ranges.slice(0, 5);

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
        {preview.length === 0 ? (
          <p className="text-sm text-slate-400">No upcoming time off.</p>
        ) : (
          <>
            <ul className="space-y-1.5">
              {preview.map((r) => (
                <li key={`${r.residentId}-${r.start}-${r.type}`} className="flex items-baseline gap-2 text-sm">
                  <span className="shrink-0 font-medium text-slate-800">{formatRange(r.start, r.end)}</span>
                  <span className="text-slate-600">{r.residentName}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {TYPE_LABELS[r.type]}
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

            <div className="min-h-0 flex-1 overflow-y-auto">
              {ranges.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming time off.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {ranges.map((r) => (
                    <li
                      key={`${r.residentId}-${r.start}-${r.type}`}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="font-medium text-slate-800">{formatRange(r.start, r.end)}</span>
                        <span className="text-slate-600">{r.residentName}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {TYPE_LABELS[r.type]}
                        </span>
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
            <div className="min-h-0 flex-1 overflow-y-auto">
              {ranges.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming time off.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {ranges.map((r) => (
                    <li
                      key={`${r.residentId}-${r.start}-${r.type}`}
                      className="flex flex-wrap items-baseline gap-2 py-2 text-sm"
                    >
                      <span className="shrink-0 font-medium text-slate-800">
                        {formatRange(r.start, r.end)}
                      </span>
                      <span className="text-slate-600">{r.residentName}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {TYPE_LABELS[r.type]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
