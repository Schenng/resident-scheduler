"use client";

import { useState } from "react";
import { toISODate } from "@/lib/utils/date";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Read-only month calendar. Dates in `marked` are highlighted ("blocked out");
 * `labels` supplies an optional tooltip (e.g. resident names) per date.
 */
export function MonthCalendar({
  marked,
  labels,
  accent = "slate",
}: {
  marked: Set<string>;
  labels?: Map<string, string[]>;
  accent?: "slate" | "amber";
}) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const first = new Date(cursor.y, cursor.m, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const todayISO = toISODate(now);

  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const markedTone =
    accent === "amber" ? "bg-amber-100 text-amber-800 font-semibold" : "bg-slate-800 text-white font-semibold";

  function step(delta: number) {
    setCursor((c) => {
      const m = c.m + delta;
      if (m < 0) return { y: c.y - 1, m: 11 };
      if (m > 11) return { y: c.y + 1, m: 0 };
      return { y: c.y, m };
    });
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => step(-1)}
          className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-slate-900">{monthLabel}</span>
        <button
          onClick={() => step(1)}
          className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`b-${i}`} />;
          const iso = toISODate(new Date(cursor.y, cursor.m, d));
          const isMarked = marked.has(iso);
          const isToday = iso === todayISO;
          return (
            <div
              key={iso}
              title={labels?.get(iso)?.join(", ")}
              className={`flex h-8 items-center justify-center rounded-lg text-sm ${
                isMarked
                  ? markedTone
                  : isToday
                    ? "text-slate-900 ring-1 ring-slate-300"
                    : "text-slate-600"
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
