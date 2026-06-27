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

// Residents are shown by the first four letters of their last name. The full
// name ("Last, First") is still stored and used everywhere else.
function displayName(chip: ChipModel): string {
  if (chip.personType !== "resident") return chip.label;
  const lastName = chip.label.split(",")[0].trim();
  return lastName.slice(0, 4);
}

export function Chip({
  chip,
  selected,
  draggable,
  onSelect,
  onRemove,
  dimmed,
}: {
  chip: ChipModel;
  selected: boolean;
  draggable: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  // When omitted, non-assignable chips render greyed. Pass false to keep the
  // normal role color while still being non-interactive.
  dimmed?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: chip.id,
    data: chip,
    disabled: !draggable || !chip.assignable,
  });

  const isDimmed = dimmed ?? !chip.assignable;
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium select-none";
  const tone = isDimmed
    ? "bg-slate-100 text-slate-400 border-slate-200"
    : TYPE_CLASSES[chip.personType];
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
      <span title={chip.label}>{displayName(chip)}</span>
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
          className="-ml-0.5 -mr-1 text-[11px] leading-none opacity-60 hover:text-red-600 hover:opacity-100"
          aria-label="Remove"
        >
          ✕
        </button>
      )}
    </span>
  );
}
