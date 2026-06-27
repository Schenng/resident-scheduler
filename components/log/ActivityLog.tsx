import Link from "next/link";

export function ActivityLog({ dayId }: { dayId: string }) {
  return (
    <Link
      href={`/schedule/log/${dayId}`}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      Day Log
    </Link>
  );
}
