import type { DayStatus } from "@/types";

const STYLES: Record<DayStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  active: "bg-green-100 text-green-700",
  archived: "bg-slate-200 text-slate-500",
};

const LABELS: Record<DayStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: DayStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
