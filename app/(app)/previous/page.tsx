import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/ui/AppHeader";
import { DeleteDayButton } from "@/components/previous/DeleteDayButton";
import { formatLong } from "@/lib/utils/date";
import type { ScheduleDay } from "@/types";

export const dynamic = "force-dynamic";

export default async function PreviousPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("schedule_days")
    .select("*")
    .eq("status", "archived")
    .order("date", { ascending: false });

  const days = (data ?? []) as ScheduleDay[];

  return (
    <>
      <AppHeader title="History" subtitle={`${days.length} archived`} />
      <div className="p-4">
        {days.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-500">
            No archived days yet. Finished days appear here after you press End Day.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
            {days.map((d) => (
              <li key={d.id} className="flex items-center transition hover:bg-slate-50">
                <Link
                  href={`/previous/${d.id}`}
                  className="flex flex-1 items-center justify-between px-4 py-3"
                >
                  <span>
                    <span className="font-medium text-slate-900">{formatLong(d.date)}</span>
                    {d.ended_at && (
                      <span className="ml-2 text-sm text-slate-400">
                        ended{" "}
                        {new Date(d.ended_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </span>
                  <span className="text-slate-300">›</span>
                </Link>
                <DeleteDayButton id={d.id} label={formatLong(d.date)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
