import type {
  Resident,
  Resident24hr,
  ResidentAvailability,
  ResidentStatus,
  ResidentWithStatus,
} from "@/types";
import { addDays } from "./date";

const STATUS_LABELS: Record<ResidentStatus, string | null> = {
  on: null,
  pre_call: "pre-call",
  "24hr": "24",
  post_call: "post-call",
  off: "off",
};

// Post-call and Off residents cannot be assigned to a room.
const ASSIGNABLE: Record<ResidentStatus, boolean> = {
  on: true,
  pre_call: true,
  "24hr": true,
  post_call: false,
  off: false,
};

export function statusLabel(status: ResidentStatus): string | null {
  return STATUS_LABELS[status];
}

export function isAssignable(status: ResidentStatus): boolean {
  return ASSIGNABLE[status];
}

/**
 * Derive a resident's status for a given date from their availability and
 * 24-hour shift entries.
 *
 * Precedence (highest first):
 *   1. Off      — any vacation/sick/leave entry on the date (conflict rule:
 *                 vacation always wins over a 24-hour shift).
 *   2. 24-hour  — a 24-hour shift is entered for the date.
 *   3. Post-call — the day after an entered 24-hour shift (unassignable).
 *   4. Pre-call  — the day before an entered 24-hour shift.
 *   5. On        — default.
 *
 * `availability` and `shifts` may contain entries for any resident/date; this
 * function filters to the dates it needs, so callers can pass whole tables.
 */
export function deriveResidentStatus(
  date: string,
  availability: Pick<ResidentAvailability, "date">[],
  shifts: Pick<Resident24hr, "date">[]
): ResidentStatus {
  const offToday = availability.some((a) => a.date === date);
  if (offToday) return "off";

  const shiftDates = new Set(shifts.map((s) => s.date));
  if (shiftDates.has(date)) return "24hr";
  if (shiftDates.has(addDays(date, -1))) return "post_call";
  if (shiftDates.has(addDays(date, 1))) return "pre_call";

  return "on";
}

/** Build a board-ready resident object with status, label, and assignability. */
export function residentWithStatus(
  resident: Resident,
  date: string,
  availability: Pick<ResidentAvailability, "date">[],
  shifts: Pick<Resident24hr, "date">[]
): ResidentWithStatus {
  const status = deriveResidentStatus(date, availability, shifts);
  return {
    ...resident,
    status,
    assignable: isAssignable(status),
    statusLabel: statusLabel(status),
  };
}

/**
 * Detect dates where a vacation/sick/leave entry overlaps a 24-hour shift for
 * the same resident. Vacation wins; the chief should be warned. Returns the
 * conflicting dates.
 */
export function findStatusConflicts(
  availability: Pick<ResidentAvailability, "date">[],
  shifts: Pick<Resident24hr, "date">[]
): string[] {
  const offDates = new Set(availability.map((a) => a.date));
  return shifts.map((s) => s.date).filter((d) => offDates.has(d));
}
