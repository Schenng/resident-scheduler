import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/ui/AppHeader";
import { ResidentEditor } from "@/components/residents/ResidentEditor";
import { AvailabilityCalendar } from "@/components/residents/AvailabilityCalendar";
import { ShiftCalendar } from "@/components/residents/ShiftCalendar";
import { RotationList } from "@/components/residents/RotationList";
import { AssignmentHistory } from "@/components/residents/AssignmentHistory";
import { findStatusConflicts } from "@/lib/utils/status";
import {
  residentFullName,
  type Resident,
  type ResidentAvailability,
  type Resident24hr,
  type ResidentRotation,
  type ScheduleSlot,
  type ScheduleDay,
} from "@/types";

export const dynamic = "force-dynamic";

export default async function ResidentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [
    { data: resident },
    { data: availability },
    { data: shifts },
    { data: rotations },
    { data: slots },
  ] = await Promise.all([
    supabase.from("residents").select("*").eq("id", params.id).single(),
    supabase
      .from("resident_availability")
      .select("*")
      .eq("resident_id", params.id)
      .order("date", { ascending: true }),
    supabase
      .from("resident_24hr")
      .select("*")
      .eq("resident_id", params.id)
      .order("date", { ascending: true }),
    supabase
      .from("resident_rotations")
      .select("*")
      .eq("resident_id", params.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("schedule_slots")
      .select("id, day_id, room_id, person_name, person_type, resident_id, position")
      .eq("resident_id", params.id),
  ]);

  if (!resident) notFound();

  const r = resident as Resident;
  const avail = (availability ?? []) as ResidentAvailability[];
  const shiftRows = (shifts ?? []) as Resident24hr[];
  const rotationRows = (rotations ?? []) as ResidentRotation[];
  const slotRows = (slots ?? []) as ScheduleSlot[];

  const conflicts = findStatusConflicts(avail, shiftRows);

  // Resolve assignment history: join slots → days (archived) → room labels.
  const dayIds = Array.from(new Set(slotRows.map((s) => s.day_id)));
  let history: { date: string; roomLabel: string }[] = [];
  if (dayIds.length > 0) {
    const [{ data: days }, { data: rooms }] = await Promise.all([
      supabase.from("schedule_days").select("id, date, status").in("id", dayIds),
      supabase.from("rooms").select("id, label"),
    ]);
    const dayMap = new Map(((days ?? []) as ScheduleDay[]).map((d) => [d.id, d]));
    const roomMap = new Map(
      ((rooms ?? []) as { id: string; label: string }[]).map((rm) => [rm.id, rm.label])
    );
    history = slotRows
      .map((s) => {
        const day = dayMap.get(s.day_id);
        if (!day || day.status !== "archived") return null;
        return {
          date: day.date,
          roomLabel: s.room_id ? roomMap.get(s.room_id) ?? "—" : "Unassigned",
        };
      })
      .filter((x): x is { date: string; roomLabel: string } => x !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  return (
    <>
      <AppHeader title={residentFullName(r)} subtitle={r.level ?? undefined} />

      <div className="space-y-6 p-4">
        <Link href="/residents" className="text-sm text-slate-500 hover:text-slate-700">
          ‹ Back to roster
        </Link>

        <ResidentEditor resident={r} />

        {conflicts.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <strong>Heads up:</strong> {conflicts.length} date
            {conflicts.length > 1 ? "s have" : " has"} both time-off and a 24-hour
            shift. Time-off wins — the resident is marked Off on{" "}
            {conflicts.join(", ")}.
          </div>
        )}

        <ShiftCalendar residentId={r.id} entries={shiftRows} conflictDates={conflicts} />

        <AvailabilityCalendar
          residentId={r.id}
          entries={avail}
          conflictDates={conflicts}
        />

        <RotationList residentId={r.id} entries={rotationRows} />

        <AssignmentHistory history={history} />
      </div>
    </>
  );
}
