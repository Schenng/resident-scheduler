"use client";

import { useDroppable } from "@dnd-kit/core";

/** A drop target representing a room (roomId) or the pool (roomId = null). */
export function Droppable({
  id,
  roomId,
  highlight,
  onTap,
  children,
  className = "",
}: {
  id: string;
  roomId: string | null;
  highlight: boolean;
  onTap?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { roomId } });

  return (
    <div
      ref={setNodeRef}
      onClick={onTap}
      className={`${className} ${
        isOver ? "outline outline-2 outline-slate-800" : ""
      } ${highlight ? "ring-2 ring-slate-300" : ""}`}
    >
      {children}
    </div>
  );
}
