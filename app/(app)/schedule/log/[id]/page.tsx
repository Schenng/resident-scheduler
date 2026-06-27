import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/ui/AppHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatLong } from "@/lib/utils/date";
import type { ScheduleDay, ActivityLogEntry } from "@/types";

export const dynamic = "force-dynamic";

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function DayLogPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: dayRow }, { data: log }] = await Promise.all([
    supabase.from("schedule_days").select("*").eq("id", params.id).single(),
    supabase
      .from("activity_log")
      .select("*")
      .eq("day_id", params.id)
      .order("timestamp", { ascending: false }),
  ]);

  if (!dayRow) notFound();
  const day = dayRow as ScheduleDay;
  const logList = (log ?? []) as ActivityLogEntry[];

  return (
    <>
      <AppHeader
        title="Day Log"
        subtitle={formatLong(day.date)}
        badge={<StatusBadge status={day.status} />}
      />

      <div className="space-y-4 p-4 pb-24">
        <Link href="/schedule" className="text-sm text-slate-500 hover:text-slate-700">
          ‹ Back to schedule
        </Link>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          {logList.length === 0 ? (
            <p className="text-sm text-slate-400">No changes logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {logList.map((e) => (
                <li key={e.id} className="flex items-baseline gap-2 text-sm">
                  <span className="shrink-0 text-slate-400">{formatTime(e.timestamp)}</span>
                  <span>
                    <span className="font-medium text-slate-900">{e.person_name}</span>
                    {e.from_room && (
                      <>
                        <span className="text-slate-400"> · </span>
                        <span className="text-slate-600">{e.from_room}</span>
                      </>
                    )}
                    <span className="text-slate-400"> → </span>
                    <span className="text-slate-600">{e.to_room}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
