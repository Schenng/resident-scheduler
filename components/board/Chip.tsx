"use client";

import { useDraggable } from "@dnd-kit/core";
import type { PersonType } from "@/types";

export interface ChipModel {
  // Stable DnD id.
  id: string;
  label: string;
  personType: PersonType;
  // One of these identifies the underlying record.
  slotId?: string; // present for attendings, CRNAs, placed residents
  residentId?: string; // present for roster residents (placed or in pool)
  fromRoomId?: string | null; // current room (null = pool)
  statusLabel?: string | null;
  assignable: boolean; // false → greyed, not draggable/selectable
}

const TYPE_CLASSES: Record<PersonType, string> = {
  attending: "bg-blue-100 text-blue-800 border-blue-300",
  resident: "bg-green-100 text-green-800 border-green-300",
  crna: "bg-amber-100 text-amber-800 border-amber-300",
};

export function Chip({
  chip,
  selected,
  draggable,
  onSelect,
  onRemove,
}: {
  chip: ChipModel;
  selected: boolean;
  draggable: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: chip.id,
    data: chip,
    disabled: !draggable || !chip.assignable,
  });

  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium select-none";
  const tone = chip.assignable
    ? TYPE_CLASSES[chip.personType]
    : "bg-slate-100 text-slate-400 border-slate-200";
  const ring = selected ? "ring-2 ring-offset-1 ring-slate-800" : "";
  const drag = isDragging ? "opacity-40" : "";

  return (
    <span
      ref={setNodeRef}
      {...(chip.assignable ? listeners : {})}
      {...attributes}
      onClick={
        chip.assignable
          ? (e) => {
              // Stop the click from bubbling to the room's drop handler,
              // which would immediately try to place (and cancel) the selection.
              e.stopPropagation();
              onSelect?.();
            }
          : undefined
      }
      className={`${base} ${tone} ${ring} ${drag} ${
        chip.assignable ? "cursor-pointer touch-none" : "cursor-default"
      }`}
    >
      <span>{chip.label}</span>
      {chip.statusLabel && (
        <span className="rounded bg-black/5 px-1 text-[10px] uppercase tracking-wide">
          {chip.statusLabel}
        </span>
      )}
      {onRemove && chip.assignable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 opacity-60 hover:text-red-600 hover:opacity-100"
          aria-label="Remove"
        >
          ✕
        </button>
      )}
    </span>
  );
}
