"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { BoardData } from "@/lib/data/board";
import {
  SECTION_ORDER,
  SECTION_LABELS,
  residentFullName,
  type RoomSection,
  type PersonType,
} from "@/types";
import { Chip, type ChipModel } from "./Chip";
import { Droppable } from "./Droppable";
import { AddPersonInline } from "./AddPersonInline";
import { StartDayButton, EndDayButton } from "./DayControls";
import { ActivityLog } from "@/components/log/ActivityLog";
import { addSlot, moveSlot, removeSlot } from "@/app/(app)/schedule/actions";

const POOL_DROP_ID = "pool";

export function Board({ data }: { data: BoardData }) {
  const router = useRouter();
  const { day, rooms, slots, residents } = data;
  const editable = day.status === "draft" || day.status === "active";

  const [selected, setSelected] = useState<ChipModel | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

  // ---- Build chips --------------------------------------------------------
  const residentStatus = useMemo(
    () => new Map(residents.map((r) => [r.id, r])),
    [residents]
  );

  const { roomChips, poolChips } = useMemo(() => {
    const byRoom = new Map<string, ChipModel[]>();
    const pool: ChipModel[] = [];

    // Slots (attendings, CRNAs, placed residents).
    for (const s of slots) {
      const assignable =
        s.person_type === "resident" && s.resident_id
          ? residentStatus.get(s.resident_id)?.assignable ?? true
          : true;
      const statusLabel =
        s.person_type === "resident" && s.resident_id
          ? residentStatus.get(s.resident_id)?.statusLabel ?? null
          : null;
      const chip: ChipModel = {
        id: `slot-${s.id}`,
        label: s.person_name,
        personType: s.person_type,
        slotId: s.id,
        residentId: s.resident_id ?? undefined,
        fromRoomId: s.room_id,
        statusLabel,
        assignable,
      };
      if (s.room_id === null) pool.push(chip);
      else {
        const arr = byRoom.get(s.room_id) ?? [];
        arr.push(chip);
        byRoom.set(s.room_id, arr);
      }
    }

    // Unplaced roster residents → pool (greyed if off/post-call).
    const placed = new Set(slots.filter((s) => s.resident_id).map((s) => s.resident_id));
    for (const r of residents) {
      if (placed.has(r.id)) continue;
      pool.push({
        id: `res-${r.id}`,
        label: residentFullName(r),
        personType: "resident",
        residentId: r.id,
        fromRoomId: null,
        statusLabel: r.statusLabel,
        assignable: r.assignable,
      });
    }

    return { roomChips: byRoom, poolChips: pool };
  }, [slots, residents, residentStatus]);

  // Roster residents available to place: assignable and not already in a slot.
  const availableResidents = useMemo(() => {
    const placed = new Set(slots.filter((s) => s.resident_id).map((s) => s.resident_id));
    return residents
      .filter((r) => r.assignable && !placed.has(r.id))
      .map((r) => ({ id: r.id, name: residentFullName(r) }));
  }, [slots, residents]);

  // ---- Placement logic ----------------------------------------------------
  function place(sel: ChipModel, targetRoomId: string | null) {
    if (!editable) return;

    // Roster resident from the pool.
    if (sel.residentId && !sel.slotId) {
      if (targetRoomId === null) return; // already in pool
      startTransition(async () => {
        await addSlot({
          dayId: day.id,
          roomId: targetRoomId,
          personName: sel.label,
          personType: "resident",
          residentId: sel.residentId!,
          dayStatus: day.status,
        });
        router.refresh();
      });
      return;
    }

    // Slot-backed chip (attending, CRNA, or placed resident).
    if (sel.slotId) {
      if (sel.fromRoomId === targetRoomId) return; // no-op
      startTransition(async () => {
        if (targetRoomId === null && sel.personType === "resident") {
          // Returning a resident to the pool = delete the slot.
          await removeSlot({
            slotId: sel.slotId!,
            dayId: day.id,
            fromRoomId: sel.fromRoomId ?? null,
            personName: sel.label,
            personType: sel.personType,
            dayStatus: day.status,
          });
        } else {
          await moveSlot({
            slotId: sel.slotId!,
            dayId: day.id,
            toRoomId: targetRoomId,
            fromRoomId: sel.fromRoomId ?? null,
            personName: sel.label,
            personType: sel.personType,
            dayStatus: day.status,
          });
        }
        router.refresh();
      });
    }
  }

  function onTapChip(chip: ChipModel) {
    setSelected((cur) => (cur?.id === chip.id ? null : chip));
  }

  function onTapTarget(targetRoomId: string | null) {
    if (selected) {
      place(selected, targetRoomId);
      setSelected(null);
    }
  }

  function onRemove(chip: ChipModel) {
    if (!chip.slotId || !editable) return;
    startTransition(async () => {
      await removeSlot({
        slotId: chip.slotId!,
        dayId: day.id,
        fromRoomId: chip.fromRoomId ?? null,
        personName: chip.label,
        personType: chip.personType,
        dayStatus: day.status,
      });
      router.refresh();
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const chip = e.active.data.current as ChipModel | undefined;
    const target = e.over?.data.current as { roomId: string | null } | undefined;
    if (chip && e.over) {
      place(chip, target?.roomId ?? null);
    }
    setSelected(null);
  }

  function addPerson(
    roomId: string | null,
    input: { type: PersonType; name: string; residentId?: string }
  ) {
    startTransition(async () => {
      await addSlot({
        dayId: day.id,
        roomId,
        personName: input.name,
        personType: input.type,
        residentId: input.residentId ?? null,
        dayStatus: day.status,
      });
      router.refresh();
    });
  }

  // ---- Group rooms by section --------------------------------------------
  const roomsBySection = useMemo(() => {
    const map = new Map<RoomSection, typeof rooms>();
    for (const r of rooms) {
      const arr = map.get(r.section) ?? [];
      arr.push(r);
      map.set(r.section, arr);
    }
    return map;
  }, [rooms]);

  const placing = selected !== null;

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      {/* Controls — hidden when the day is active (moved to bottom) */}
      {day.status !== "active" && (
        <div className="sticky top-[57px] z-10 flex items-center gap-2 border-b border-slate-200 bg-slate-50/90 px-4 py-2 backdrop-blur">
          {day.status === "draft" && <StartDayButton dayId={day.id} />}
          {day.status === "archived" && (
            <p className="text-sm text-slate-500">
              This day is archived (read-only). Create a new draft tomorrow.
            </p>
          )}
          {pending && <span className="text-xs text-slate-400">saving…</span>}
        </div>
      )}

      {placing && (
        <div className="px-4 pt-3 text-sm text-slate-500">
          Moving <strong>{selected!.label}</strong> — tap a room to place, or tap the
          chip again to cancel.
        </div>
      )}

      <div className="space-y-3 p-3 pb-24">
        {SECTION_ORDER.map((section) => (
          <section key={section}>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {SECTION_LABELS[section]}
            </h2>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {(roomsBySection.get(section) ?? []).map((room) => (
                <Droppable
                  key={room.id}
                  id={`room-${room.id}`}
                  roomId={room.id}
                  highlight={placing}
                  onTap={() => onTapTarget(room.id)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1"
                >
                  <div className="w-14 shrink-0 whitespace-nowrap text-xs font-semibold text-slate-700">
                    {room.label}
                  </div>
                  <div className="flex flex-1 flex-wrap items-center gap-1">
                    {(roomChips.get(room.id) ?? []).map((chip) => (
                      <Chip
                        key={chip.id}
                        chip={chip}
                        selected={selected?.id === chip.id}
                        draggable={editable}
                        onSelect={() => onTapChip(chip)}
                        onRemove={editable ? () => onRemove(chip) : undefined}
                      />
                    ))}
                    {editable && (
                      <AddPersonInline
                        residents={availableResidents}
                        onAdd={(input) => addPerson(room.id, input)}
                      />
                    )}
                  </div>
                </Droppable>
              ))}
            </div>
          </section>
        ))}

        {/* Unassigned pool */}
        <Droppable
          id={POOL_DROP_ID}
          roomId={null}
          highlight={placing}
          onTap={() => onTapTarget(null)}
          className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-3"
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Unassigned
          </div>
          <div className="flex flex-wrap gap-1.5">
            {poolChips.length === 0 && (
              <span className="text-sm text-slate-400">Everyone is assigned.</span>
            )}
            {poolChips.map((chip) => (
              <Chip
                key={chip.id}
                chip={chip}
                selected={selected?.id === chip.id}
                draggable={editable}
                onSelect={() => onTapChip(chip)}
                onRemove={chip.slotId && editable ? () => onRemove(chip) : undefined}
              />
            ))}
          </div>
        </Droppable>
      </div>

      {day.status === "active" && (
        <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-slate-200 bg-slate-50/90 px-4 py-2 backdrop-blur">
          <ActivityLog dayId={day.id} />
          {pending && <span className="text-xs text-slate-400">saving…</span>}
          <div className="flex-1" />
          <EndDayButton dayId={day.id} />
        </div>
      )}
    </DndContext>
  );
}
