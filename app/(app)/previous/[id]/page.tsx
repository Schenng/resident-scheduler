import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/ui/AppHeader";
import { formatLong } from "@/lib/utils/date";
import {
  SECTION_ORDER,
  SECTION_LABELS,
  type RoomSection,
  type Room,
  type ScheduleDay,
  type ScheduleSlot,
  type ActivityLogEntry,
  type PersonType,
} from "@/types";

export const dynamic = "force-dynamic";

const CHIP_CLASS: Record<PersonType, string> = {
  attending: "bg-blue-100 text-blue-800",
  resident: "bg-green-100 text-green-800",
  crna: "bg-amber-100 text-amber-800",
};

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function ArchivedDayPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: dayRow }, { data: rooms }, { data: slots }, { data: log }] =
    await Promise.all([
      supabase.from("schedule_days").select("*").eq("id", params.id).single(),
      supabase.from("rooms").select("*").order("section").order("sort_order"),
      supabase.from("schedule_slots").select("*").eq("day_id", params.id).order("position"),
      supabase
        .from("activity_log")
        .select("*")
        .eq("day_id", params.id)
        .order("timestamp", { ascending: false }),
    ]);

  if (!dayRow) notFound();
  const day = dayRow as ScheduleDay;
  const roomList = (rooms ?? []) as Room[];
  const slotList = (slots ?? []) as ScheduleSlot[];
  const logList = (log ?? []) as ActivityLogEntry[];

  const slotsByRoom = new Map<string, ScheduleSlot[]>();
  for (const s of slotList) {
    if (!s.room_id) continue;
    const arr = slotsByRoom.get(s.room_id) ?? [];
    arr.push(s);
    slotsByRoom.set(s.room_id, arr);
  }

  const roomsBySection = new Map<RoomSection, Room[]>();
  for (const r of roomList) {
    const arr = roomsBySection.get(r.section) ?? [];
    arr.push(r);
    roomsBySection.set(r.section, arr);
  }

  return (
    <>
      <AppHeader title={formatLong(day.date)} subtitle="Archived · read-only" />

      <div className="space-y-6 p-4 pb-24">
        <Link href="/previous" className="text-sm text-slate-500 hover:text-slate-700">
          ‹ Back to archive
        </Link>

        {SECTION_ORDER.map((section) => {
          const sectionRooms = (roomsBySection.get(section) ?? []).filter(
            (r) => (slotsByRoom.get(r.id) ?? []).length > 0
          );
          if (sectionRooms.length === 0) return null;
          return (
            <section key={section}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {SECTION_LABELS[section]}
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sectionRooms.map((room) => (
                  <div key={room.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 text-sm font-semibold text-slate-700">{room.label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(slotsByRoom.get(room.id) ?? []).map((s) => (
                        <span
                          key={s.id}
                          className={`rounded-full px-2.5 py-1 text-sm font-medium ${CHIP_CLASS[s.person_type]}`}
                        >
                          {s.person_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Activity Log
          </h2>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            {logList.length === 0 ? (
              <p className="text-sm text-slate-400">No changes were logged.</p>
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
        </section>
      </div>
    </>
  );
}
