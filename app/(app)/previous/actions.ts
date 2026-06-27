"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Permanently delete an archived schedule day. Its schedule_slots and
 * activity_log rows are removed automatically via on-delete cascade.
 */
export async function deleteScheduleDay(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("schedule_days").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/previous");
}
