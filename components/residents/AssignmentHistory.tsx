import { formatLong } from "@/lib/utils/date";

export function AssignmentHistory({
  history,
}: {
  history: { date: string; roomLabel: string }[];
}) {
  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Assignment History</h2>
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No archived assignments yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {history.map((h, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-600">{formatLong(h.date)}</span>
              <span className="font-medium text-slate-900">{h.roomLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
