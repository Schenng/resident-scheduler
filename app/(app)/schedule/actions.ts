"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/utils/date";
import type { ActionType, PersonType } from "@/types";

/**
 * Start a new day. If a day is already open (draft or active) it is returned
 * unchanged; otherwise a fresh draft is created for today. Multiple days per
 * calendar date are allowed, so this works right after ending a day.
 */
export async function ensureToday(): Promise<string> {
  const supabase = createClient();
  const date = toISODate();

  // Reuse an open day if one exists (avoids duplicate drafts).
  const { data: open } = await supabase
    .from("schedule_days")
    .select("id")
    .in("status", ["draft", "active"])
    .limit(1)
    .maybeSingle();

  if (open) return open.id as string;

  const { data, error } = await supabase
    .from("schedule_days")
    .insert({ date, status: "draft" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/schedule");
  return data.id as string;
}

export async function startDay(dayId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("schedule_days")
    .update({ status: "active", started_at: new Date().toISOString() })
    .eq("id", dayId)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
  revalidatePath("/schedule");
}

export async function endDay(dayId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("schedule_days")
    .update({ status: "archived", ended_at: new Date().toISOString() })
    .eq("id", dayId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
  revalidatePath("/schedule");
  revalidatePath("/previous");
}

// ---------- Slot mutations --------------------------------------------------

interface AddSlotInput {
  dayId: string;
  roomId: string | null;
  personName: string;
  personType: PersonType;
  residentId?: string | null;
  dayStatus: string;
}

export async function addSlot(input: AddSlotInput) {
  const supabase = createClient();

  // Determine next position within the target room (or pool).
  let q = supabase
    .from("schedule_slots")
    .select("id", { count: "exact", head: true })
    .eq("day_id", input.dayId);
  q = input.roomId === null ? q.is("room_id", null) : q.eq("room_id", input.roomId);
  const { count } = await q;
  const position = count ?? 0;

  const { data, error } = await supabase
    .from("schedule_slots")
    .insert({
      day_id: input.dayId,
      room_id: input.roomId,
      person_name: input.personName.trim(),
      person_type: input.personType,
      resident_id: input.residentId ?? null,
      position,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await maybeLog(supabase, input.dayId, input.dayStatus, {
    action: "add",
    personName: input.personName.trim(),
    personType: input.personType,
    fromRoom: null,
    toRoom: input.roomId,
  });

  revalidatePath("/schedule");
  return data.id as string;
}

interface MoveSlotInput {
  slotId: string;
  dayId: string;
  toRoomId: string | null; // room id or null (pool)
  fromRoomId: string | null; // room id or null (pool) — resolved to a label when logged
  personName: string;
  personType: PersonType;
  dayStatus: string;
}

export async function moveSlot(input: MoveSlotInput) {
  const supabase = createClient();
  const { error } = await supabase
    .from("schedule_slots")
    .update({ room_id: input.toRoomId })
    .eq("id", input.slotId);
  if (error) throw new Error(error.message);

  await maybeLog(supabase, input.dayId, input.dayStatus, {
    action: "move",
    personName: input.personName,
    personType: input.personType,
    fromRoom: input.fromRoomId,
    toRoom: input.toRoomId,
  });

  revalidatePath("/schedule");
}

interface RemoveSlotInput {
  slotId: string;
  dayId: string;
  fromRoomId: string | null; // room id or null (pool) — resolved to a label when logged
  personName: string;
  personType: PersonType;
  dayStatus: string;
}

export async function removeSlot(input: RemoveSlotInput) {
  const supabase = createClient();
  const { error } = await supabase.from("schedule_slots").delete().eq("id", input.slotId);
  if (error) throw new Error(error.message);

  await maybeLog(supabase, input.dayId, input.dayStatus, {
    action: "remove",
    personName: input.personName,
    personType: input.personType,
    fromRoom: input.fromRoomId,
    toRoom: null,
  });

  revalidatePath("/schedule");
}

// ---------- Activity log ----------------------------------------------------

async function maybeLog(
  supabase: ReturnType<typeof createClient>,
  dayId: string,
  dayStatus: string,
  entry: {
    action: ActionType;
    personName: string;
    personType: PersonType;
    fromRoom: string | null; // room id or null
    toRoom: string | null; // room id or null
  }
) {
  // Only log once the day is active. Draft setup is silent.
  if (dayStatus !== "active") return;

  // Resolve the destination room id → label. Removing a person from the board
  // is recorded as "Unassigned"; otherwise it's the target room (or pool).
  let destination = "Unassigned";
  if (entry.action !== "remove" && entry.toRoom) {
    const { data: room } = await supabase
      .from("rooms")
      .select("label")
      .eq("id", entry.toRoom)
      .maybeSingle();
    destination = room?.label ?? "Unassigned";
  }

  // A failed log write must never undo or block the move that already saved.
  try {
    await supabase.from("activity_log").insert({
      day_id: dayId,
      action_type: entry.action,
      person_name: entry.personName,
      person_type: entry.personType,
      from_room: null,
      to_room: destination,
    });
  } catch (e) {
    console.error("activity_log insert failed:", e);
  }
}
