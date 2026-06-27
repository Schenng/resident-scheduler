import { createClient } from "@/lib/supabase/server";
import { residentWithStatus } from "@/lib/utils/status";
import type {
  ActivityLogEntry,
  Resident,
  ResidentAvailability,
  Resident24hr,
  ResidentWithStatus,
  Room,
  ScheduleDay,
  ScheduleSlot,
} from "@/types";

export interface BoardData {
  day: ScheduleDay;
  rooms: Room[];
  slots: ScheduleSlot[];
  /** Active residents with status derived for the day's date. */
  residents: ResidentWithStatus[];
  /** Most recent activity-log entries (newest first), for the board's Recent Log. */
  recentLog: ActivityLogEntry[];
}

/**
 * Load everything needed to render the board for a given day. Resident statuses
 * are derived for `day.date` from availability + 24hr tables (never stored).
 */
export async function loadBoard(day: ScheduleDay): Promise<BoardData> {
  const supabase = createClient();

  const [
    { data: rooms },
    { data: slots },
    { data: residents },
    { data: availability },
    { data: shifts },
    { data: log },
  ] = await Promise.all([
    supabase.from("rooms").select("*").order("section").order("sort_order"),
    supabase.from("schedule_slots").select("*").eq("day_id", day.id).order("position"),
    supabase
      .from("residents")
      .select("*")
      .eq("active", true)
      .order("last_name")
      .order("first_name"),
    supabase.from("resident_availability").select("resident_id, date"),
    supabase.from("resident_24hr").select("resident_id, date"),
    supabase
      .from("activity_log")
      .select("*")
      .eq("day_id", day.id)
      .order("timestamp", { ascending: false })
      .limit(5),
  ]);

  const availRows = (availability ?? []) as Pick<ResidentAvailability, "resident_id" | "date">[];
  const shiftRows = (shifts ?? []) as Pick<Resident24hr, "resident_id" | "date">[];

  const residentsWithStatus = ((residents ?? []) as Resident[]).map((r) =>
    residentWithStatus(
      r,
      day.date,
      availRows.filter((a) => a.resident_id === r.id),
      shiftRows.filter((s) => s.resident_id === r.id)
    )
  );

  return {
    day,
    rooms: (rooms ?? []) as Room[],
    slots: (slots ?? []) as ScheduleSlot[],
    residents: residentsWithStatus,
    recentLog: (log ?? []) as ActivityLogEntry[],
  };
}
