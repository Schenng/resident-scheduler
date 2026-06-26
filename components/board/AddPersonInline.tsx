"use client";

import { useState } from "react";
import type { PersonType } from "@/types";

/** Inline "+ add" control inside a room for typing an attending or CRNA name. */
export function AddPersonInline({
  onAdd,
}: {
  onAdd: (name: string, type: PersonType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PersonType>("attending");

  function submit() {
    if (!name.trim()) return;
    onAdd(name.trim(), type);
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-600"
      >
        + add
      </button>
    );
  }

  return (
    <span
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-1.5 py-0.5"
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value as PersonType)}
        className="bg-transparent text-xs text-slate-600 outline-none"
      >
        <option value="attending">Attending</option>
        <option value="crna">CRNA</option>
      </select>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Name"
        className="w-24 text-sm outline-none"
      />
      <button onClick={submit} className="text-sm text-green-600 hover:text-green-800" aria-label="Add">
        ✓
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setName("");
        }}
        className="text-sm text-slate-400 hover:text-slate-600"
        aria-label="Cancel"
      >
        ✕
      </button>
    </span>
  );
}
