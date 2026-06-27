"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteScheduleDay } from "@/app/(app)/previous/actions";

export function DeleteDayButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (
      !confirm(
        `Delete the archived schedule for ${label}? This permanently removes it and its activity log.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteScheduleDay(id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      className="shrink-0 px-4 text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
