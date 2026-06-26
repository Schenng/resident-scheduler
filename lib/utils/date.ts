// Date helpers. All dates are handled as YYYY-MM-DD strings to avoid timezone
// drift — the app tracks day-level data only, never times.

/** Format a Date (or now) as a local YYYY-MM-DD string. */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add (or subtract) days to a YYYY-MM-DD string, returning a YYYY-MM-DD string. */
export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toISODate(dt);
}

/** Inclusive check: is `iso` between start and end (all YYYY-MM-DD)? */
export function isWithin(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

/** Human-friendly long date, e.g. "Monday, June 29, 2026". */
export function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Short date, e.g. "Jun 29". */
export function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
