"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActivityLogEntry } from "@/types";

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityLog({ dayId }: { dayId: string }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("activity_log")
      .select("*")
      .eq("day_id", dayId)
      .order("timestamp", { ascending: false })
      .then(({ data }) => {
        setEntries((data ?? []) as ActivityLogEntry[]);
        setLoading(false);
      });
  }, [open, dayId]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Day Log
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={() => setOpen(false)}>
          <div
            className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="font-semibold text-slate-900">Day Log</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : entries.length === 0 ? (
                <p className="text-sm text-slate-400">No changes logged yet.</p>
              ) : (
                <ul className="space-y-3">
                  {entries.map((e) => (
                    <li key={e.id} className="flex items-baseline gap-2 text-sm">
                      <span className="shrink-0 text-slate-400">{formatTime(e.timestamp)}</span>
                      <span>
                        <span className="font-medium text-slate-900">{e.person_name}</span>
                        <span className="text-slate-400"> → </span>
                        <span className="text-slate-600">{e.to_room}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
