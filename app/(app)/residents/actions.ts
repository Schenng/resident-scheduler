"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilityType, CallType } from "@/types";

// ---------- Roster ----------------------------------------------------------

export async function createResident(
  firstName: string,
  lastName: string,
  level: string | null
) {
  const supabase = createClient();
  const { error } = await supabase.from("residents").insert({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    level: level?.trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/residents");
}

export async function updateResident(
  id: string,
  firstName: string,
  lastName: string,
  level: string | null
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("residents")
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      level: level?.trim() || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/residents");
  revalidatePath(`/residents/${id}`);
}

export async function setResidentActive(id: string, active: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("residents")
    .update({ active })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/residents");
  revalidatePath(`/residents/${id}`);
}

/**
 * Permanently delete a resident. Availability / 24hr / rotation rows cascade.
 * Past schedule slots are detached (resident_id cleared) so historical boards
 * keep the typed-in name without blocking the delete on the foreign key.
 */
export async function deleteResident(id: string) {
  const supabase = createClient();
  await supabase.from("schedule_slots").update({ resident_id: null }).eq("resident_id", id);
  const { error } = await supabase.from("residents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/residents");
}

// ---------- Vacation / sick / leave ----------------------------------------

export async function addAvailability(
  residentId: string,
  startDate: string,
  endDate: string,
  type: AvailabilityType,
  note: string | null
) {
  const supabase = createClient();

  // Expand a date range into individual day rows.
  const rows: { resident_id: string; date: string; type: AvailabilityType; note: string | null }[] = [];
  let cursor = startDate;
  const end = endDate < startDate ? startDate : endDate;
  // Guard against runaway loops.
  for (let i = 0; i < 366 && cursor <= end; i++) {
    rows.push({ resident_id: residentId, date: cursor, type, note: note?.trim() || null });
    const [y, m, d] = cursor.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    cursor = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }

  const { error } = await supabase.from("resident_availability").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath(`/residents/${residentId}`);
  revalidatePath("/residents");
}

export async function removeAvailability(id: string, residentId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("resident_availability").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/residents/${residentId}`);
  revalidatePath("/residents");
}

/** Delete every availability row for a resident within an inclusive date range. */
export async function removeAvailabilityRange(
  residentId: string,
  startDate: string,
  endDate: string
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("resident_availability")
    .delete()
    .eq("resident_id", residentId)
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) throw new Error(error.message);
  revalidatePath(`/residents/${residentId}`);
  revalidatePath("/residents");
}

// ---------- 24-hour shifts --------------------------------------------------

export async function add24hr(residentId: string, date: string, callType: CallType) {
  const supabase = createClient();
  const { error } = await supabase
    .from("resident_24hr")
    .upsert(
      { resident_id: residentId, date, call_type: callType },
      { onConflict: "resident_id,date" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/residents/${residentId}`);
  revalidatePath("/residents");
}

export async function remove24hr(id: string, residentId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("resident_24hr").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/residents/${residentId}`);
  revalidatePath("/residents");
}

// ---------- Rotations (stub) ------------------------------------------------

export async function addRotation(
  residentId: string,
  rotationName: string,
  startDate: string,
  endDate: string
) {
  const supabase = createClient();
  const { error } = await supabase.from("resident_rotations").insert({
    resident_id: residentId,
    rotation_name: rotationName.trim(),
    start_date: startDate,
    end_date: endDate,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/residents/${residentId}`);
}

export async function removeRotation(id: string, residentId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("resident_rotations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/residents/${residentId}`);
}
