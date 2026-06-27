"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
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
import { formatLong } from "@/lib/utils/date";

const POOL_DROP_ID = "pool";

function formatLogTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function Board({ data }: { data: BoardData }) {
  const router = useRouter();
  const { day, rooms, slots, residents, recentLog } = data;
  const editable = day.status === "draft" || day.status === "active";

  const [selected, setSelected] = useState<ChipModel | null>(null);
  const [addRoomId, setAddRoomId] = useState<string | null>(null);
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

  const { roomChips, poolChips, offChips } = useMemo(() => {
    const byRoom = new Map<string, ChipModel[]>();
    const pool: ChipModel[] = [];
    const off: ChipModel[] = [];

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

    // Unplaced roster residents. Assignable ones go to the Unassigned pool;
    // those on vacation/leave ("off") or post-call go to the Off section.
    const placed = new Set(slots.filter((s) => s.resident_id).map((s) => s.resident_id));
    for (const r of residents) {
      if (placed.has(r.id)) continue;
      const chip: ChipModel = {
        id: `res-${r.id}`,
        label: residentFullName(r),
        personType: "resident",
        residentId: r.id,
        fromRoomId: null,
        statusLabel: r.statusLabel,
        assignable: r.assignable,
      };
      (r.assignable ? pool : off).push(chip);
    }

    return { roomChips: byRoom, poolChips: pool, offChips: off };
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

  // Render the current schedule to a PNG and download it. Drawn from board data
  // (not the DOM) so it works without any image-capture dependency.
  function shareSchedule() {
    const width = 760;
    const scale = 2;
    const padX = 28;
    const padY = 28;
    const lineH = 22;
    const titleH = 26;
    const sectionGap = 16;
    const labelCol = 70;
    const contentW = width - padX * 2;

    const headerFont = "bold 18px system-ui, -apple-system, sans-serif";
    const titleFont = "bold 12px system-ui, -apple-system, sans-serif";
    const labelFont = "bold 14px system-ui, -apple-system, sans-serif";
    const bodyFont = "14px system-ui, -apple-system, sans-serif";

    function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
      ctx.font = bodyFont;
      const words = text.split(" ");
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (cur && ctx.measureText(test).width > maxWidth) {
          lines.push(cur);
          cur = w;
        } else {
          cur = test;
        }
      }
      if (cur) lines.push(cur);
      return lines.length ? lines : ["—"];
    }

    const groups: { title: string; rooms: { label: string; people: string }[] }[] = [];
    for (const section of ["main_or", "sds", "endo", "special"] as RoomSection[]) {
      const rooms = roomsBySection.get(section) ?? [];
      if (rooms.length === 0) continue;
      groups.push({
        title: SECTION_LABELS[section],
        rooms: rooms.map((r) => ({
          label: r.label,
          people: (roomChips.get(r.id) ?? []).map((c) => c.label).join(", ") || "—",
        })),
      });
    }
    if (poolChips.length > 0) {
      groups.push({
        title: "Unassigned",
        rooms: [{ label: "", people: poolChips.map((c) => c.label).join(", ") }],
      });
    }

    function layout(ctx: CanvasRenderingContext2D, draw: boolean): number {
      let y = padY;
      if (draw) {
        ctx.textBaseline = "top";
        ctx.fillStyle = "#0f172a";
        ctx.font = headerFont;
        ctx.fillText(`OR Schedule — ${formatLong(day.date)}`, padX, y);
      }
      y += 34;

      for (const g of groups) {
        if (draw) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = titleFont;
          ctx.fillText(g.title.toUpperCase(), padX, y);
        }
        y += titleH;
        for (const room of g.rooms) {
          const lines = wrap(ctx, room.people, contentW - labelCol);
          if (draw) {
            if (room.label) {
              ctx.fillStyle = "#334155";
              ctx.font = labelFont;
              ctx.fillText(room.label, padX, y);
            }
            ctx.fillStyle = "#475569";
            ctx.font = bodyFont;
            lines.forEach((ln, i) => ctx.fillText(ln, padX + labelCol, y + i * lineH));
          }
          y += lines.length * lineH;
        }
        y += sectionGap;
      }
      return y + padY;
    }

    const measureCtx = document.createElement("canvas").getContext("2d");
    if (!measureCtx) return;
    const height = layout(measureCtx, false);

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    layout(ctx, true);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schedule-${day.date}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function renderSection(section: RoomSection, roomsClassName = "grid-cols-1") {
    return (
      <section>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {SECTION_LABELS[section]}
        </h2>
        <div className={`grid gap-1 ${roomsClassName}`}>
          {(roomsBySection.get(section) ?? []).map((room) => (
            <Droppable
              key={room.id}
              id={`room-${room.id}`}
              roomId={room.id}
              highlight={placing}
              // Tapping the row places a selected chip, or opens the add dialog.
              onTap={() => {
                if (placing) onTapTarget(room.id);
                else if (editable) setAddRoomId(room.id);
              }}
              className={`flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 ${
                editable ? "cursor-pointer" : ""
              }`}
            >
              <div className="shrink-0 whitespace-nowrap text-xs font-semibold text-slate-700">
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
              </div>
            </Droppable>
          ))}
        </div>
      </section>
    );
  }

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
        {/* Left column: Main OR. Right column: SDS over Endo. */}
        <div className="grid grid-cols-2 gap-3">
          <div>{renderSection("main_or")}</div>
          <div className="space-y-3">
            {renderSection("sds")}
            {renderSection("endo")}
          </div>
        </div>

        {/* Remaining rooms at the bottom. */}
        {renderSection("special", "grid-cols-2")}

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

        {/* Off — residents on vacation/leave or post-call (not assignable). */}
        {offChips.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Off
            </div>
            <div className="flex flex-wrap gap-1.5">
              {offChips.map((chip) => (
                <Chip
                  key={chip.id}
                  chip={chip}
                  selected={false}
                  draggable={false}
                  onSelect={undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Log — the last five changes; tap to open the full day log. */}
        {recentLog.length > 0 && (
          <Link
            href={`/schedule/log/${day.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Recent Log
              </span>
              <span className="text-slate-300">›</span>
            </div>
            <ul className="space-y-1.5">
              {recentLog.map((e) => (
                <li key={e.id} className="flex items-baseline gap-2 text-sm">
                  <span className="shrink-0 text-slate-400">{formatLogTime(e.timestamp)}</span>
                  <span>
                    <span className="font-medium text-slate-900">{e.person_name}</span>
                    {e.from_room && (
                      <>
                        <span className="text-slate-400"> · </span>
                        <span className="text-slate-600">{e.from_room}</span>
                      </>
                    )}
                    <span className="text-slate-400"> → </span>
                    <span className="text-slate-600">{e.to_room}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Link>
        )}
      </div>

      {day.status === "active" && (
        <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-slate-200 bg-slate-50/90 px-4 py-2 backdrop-blur">
          <ActivityLog dayId={day.id} />
          {pending && <span className="text-xs text-slate-400">saving…</span>}
          <div className="flex-1" />
          <button
            onClick={shareSchedule}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Share
          </button>
          <div className="flex-1" />
          <EndDayButton dayId={day.id} />
        </div>
      )}

      <AddPersonInline
        open={addRoomId !== null}
        roomLabel={rooms.find((r) => r.id === addRoomId)?.label ?? ""}
        residents={availableResidents}
        onAdd={(input) => {
          if (addRoomId) addPerson(addRoomId, input);
        }}
        onClose={() => setAddRoomId(null)}
      />
    </DndContext>
  );
}
