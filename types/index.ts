// ============================================================================
// Shared domain types for the OR Schedule Manager.
// ============================================================================

export type AvailabilityType = "vacation" | "sick" | "leave";
export type RoomSection = "main_or" | "sds" | "endo" | "special";
export type DayStatus = "draft" | "active" | "archived";
export type PersonType = "attending" | "resident" | "crna";
export type ActionType = "move" | "add" | "remove" | "swap";

// Derived resident status for a given date.
export type ResidentStatus = "on" | "pre_call" | "24hr" | "post_call" | "off";

export interface AppUser {
  id: string;
  email: string;
}

export interface Resident {
  id: string;
  first_name: string;
  last_name: string;
  level: string | null;
  active: boolean;
  created_at: string;
}

/** Display name for a resident: "Last, First". */
export function residentFullName(r: {
  first_name: string;
  last_name: string;
}): string {
  if (!r.last_name) return r.first_name.trim();
  if (!r.first_name) return r.last_name.trim();
  return `${r.last_name}, ${r.first_name}`.trim();
}

export interface ResidentAvailability {
  id: string;
  resident_id: string;
  date: string; // ISO date (YYYY-MM-DD)
  type: AvailabilityType;
  note: string | null;
}

export interface Resident24hr {
  id: string;
  resident_id: string;
  date: string;
}

export interface ResidentRotation {
  id: string;
  resident_id: string;
  rotation_name: string;
  start_date: string;
  end_date: string;
}

export interface Room {
  id: string;
  label: string;
  section: RoomSection;
  sort_order: number;
}

export interface ScheduleDay {
  id: string;
  date: string;
  status: DayStatus;
  started_at: string | null;
  ended_at: string | null;
}

export interface ScheduleSlot {
  id: string;
  day_id: string;
  room_id: string | null; // null = unassigned pool
  person_name: string;
  person_type: PersonType;
  resident_id: string | null;
  position: number;
}

export interface ActivityLogEntry {
  id: string;
  day_id: string;
  timestamp: string;
  action_type: ActionType;
  person_name: string;
  person_type: PersonType;
  from_room: string | null;
  to_room: string | null;
  changed_by: string | null;
}

// Section display metadata (board ordering / labels).
export const SECTION_ORDER: RoomSection[] = [
  "main_or",
  "sds",
  "endo",
  "special",
];

export const SECTION_LABELS: Record<RoomSection, string> = {
  main_or: "Main OR",
  sds: "SDS",
  endo: "Endo",
  special: "Special",
};

// A resident with their derived status for the active day, used on the board.
export interface ResidentWithStatus extends Resident {
  status: ResidentStatus;
  assignable: boolean;
  statusLabel: string | null;
}
