import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/ui/AppHeader";
import { AddResidentForm } from "@/components/residents/AddResidentForm";
import { residentFullName, type Resident } from "@/types";

export const dynamic = "force-dynamic";

export default async function ResidentsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("residents")
    .select("*")
    .order("active", { ascending: false })
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  const residents = (data ?? []) as Resident[];
  const activeResidents = residents.filter((r) => r.active);
  const inactiveResidents = residents.filter((r) => !r.active);

  return (
    <>
      <AppHeader title="Resident Hub" subtitle={`${activeResidents.length} active`} />

      <div className="space-y-6 p-4">
        <AddResidentForm />

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Roster
          </h2>
          {activeResidents.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-500">
              No residents yet. Add one above.
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
