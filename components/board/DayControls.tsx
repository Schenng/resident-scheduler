"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureToday, startDay, endDay } from "@/app/(app)/schedule/actions";

export function StartDayButton({
  dayId,
  create = false,
}: {
  dayId?: string;
  create?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      if (create) {
        await ensureToday();
      } else if (dayId) {
        await startDay(dayId);
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-green-500 disabled:opacity-50"
    >
      {pending ? "…" : create ? "Start a new day" : "Start Day"}
    </button>
  );
}

export function EndDayButton({ dayId }: { dayId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("End the day? The schedule and log will be frozen as a read-only record.")) {
      return;
    }
    startTransition(async () => {
      await endDay(dayId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="rounded-lg bg-slate-800 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
    >
      {pending ? "…" : "End Day"}
    </button>
  );
}
