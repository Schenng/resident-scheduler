import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/ui/AppHeader";
import { AddResidentForm } from "@/components/residents/AddResidentForm";
import { ShiftsManager, type UpcomingShift } from "@/components/residents/ShiftsManager";
import {
  VacationsManager,
  type UpcomingTimeOff,
} from "@/components/residents/VacationsManager";
import { toISODate, addDays } from "@/lib/utils/date";
import {
  residentFullName,
  type Resident,
  type Resident24hr,
  type ResidentAvailability,
} from "@/types";

export const dynamic = "force-dynamic";

export default async function ResidentsPage() {
  const supabase = createClient();
  const today = toISODate();

  const [{ data }, { data: shiftData }, { data: availData }] = await Promise.all([
    supabase
      .from("residents")
      .select("*")
      .order("active", { ascending: false })
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
    supabase.from("resident_24hr").select("*").gte("date", today).order("date"),
    supabase
      .from("resident_availability")
      .select("*")
      .gte("date", today)
      .order("resident_id")
      .order("date"),
  ]);

  const residents = (data ?? []) as Resident[];
  const activeResidents = residents.filter((r) => r.active);
  const inactiveResidents = residents.filter((r) => !r.active);

  // Name lookup (covers inactive residents too) and dropdown options (active only).
  const nameById = new Map(residents.map((r) => [r.id, residentFullName(r)]));
  const residentOptions = activeResidents.map((r) => ({ id: r.id, name: residentFullName(r) }));

  const upcomingShifts: UpcomingShift[] = ((shiftData ?? []) as Resident24hr[]).map((s) => ({
    id: s.id,
    residentId: s.resident_id,
    residentName: nameById.get(s.resident_id) ?? "—",
    date: s.date,
    callType: s.call_type,
  }));

  // Collapse per-day availability rows into contiguous ranges (per resident + type).
  const availRows = ((availData ?? []) as ResidentAvailability[])
    .slice()
    .sort((a, b) =>
      a.resident_id !== b.resident_id
        ? a.resident_id.localeCompare(b.resident_id)
        : a.type !== b.type
          ? a.type.localeCompare(b.type)
          : a.date.localeCompare(b.date)
    );
  const ranges: UpcomingTimeOff[] = [];
  for (const row of availRows) {
    const last = ranges[ranges.length - 1];
    if (
      last &&
      last.residentId === row.resident_id &&
      last.type === row.type &&
      addDays(last.end, 1) === row.date
    ) {
      last.end = row.date;
    } else {
      ranges.push({
        residentId: row.resident_id,
        residentName: nameById.get(row.resident_id) ?? "—",
        type: row.type,
        start: row.date,
        end: row.date,
      });
    }
  }
  ranges.sort((a, b) => a.start.localeCompare(b.start));

  return (
    <>
      <AppHeader title="Resident Hub" subtitle={`${activeResidents.length} active`} />

      <div className="space-y-6 p-4">
        <ShiftsManager residents={residentOptions} shifts={upcomingShifts} />
        <VacationsManager residents={residentOptions} ranges={ranges} />

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Residents
            </h2>
            <AddResidentForm />
          </div>
          {activeResidents.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-500">
              No residents yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
              {activeResidents.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/residents/${r.id}`}
                    className="flex items-center justify-between px-4 py-3 transition hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-900">{residentFullName(r)}</span>
                    <span className="flex items-center gap-2">
                      {r.level && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {r.level}
                        </span>
                      )}
                      <span className="text-slate-300">›</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {inactiveResidents.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Inactive
            </h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
              {inactiveResidents.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/residents/${r.id}`}
                    className="flex items-center justify-between px-4 py-3 text-slate-400 transition hover:bg-slate-50"
                  >
                    <span className="font-medium">{residentFullName(r)}</span>
                    <span className="text-xs">inactive</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
