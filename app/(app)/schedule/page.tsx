import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/ui/AppHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { loadBoard } from "@/lib/data/board";
import { Board } from "@/components/board/Board";
import { StartDayButton } from "@/components/board/DayControls";
import { formatLong, toISODate } from "@/lib/utils/date";
import type { ScheduleDay } from "@/types";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const supabase = createClient();
  const today = toISODate();

  // Load the current open day (draft or active). Archived days move to the
  // Previous tab, so once a day is ended there is no open day and the chief
  // can start a fresh one — even on the same calendar date.
  const { data: dayRow } = await supabase
    .from("schedule_days")
    .select("*")
    .in("status", ["draft", "active"])
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // No open day → offer to start a new one.
  if (!dayRow) {
    return (
      <>
        <AppHeader title="Daily Schedule" subtitle={formatLong(today)} />
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-slate-500">No schedule in progress.</p>
          <StartDayButton create />
        </div>
      </>
    );
  }

  const day = dayRow as ScheduleDay;
  const board = await loadBoard(day);

  return (
    <>
      <AppHeader
        title="Daily Schedule"
        subtitle={formatLong(day.date)}
        badge={<StatusBadge status={day.status} />}
      />
      <Board data={board} />
    </>
  );
}
