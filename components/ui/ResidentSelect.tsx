"use client";

import { useEffect, useRef, useState } from "react";

export interface ResidentOption {
  id: string;
  name: string;
}

/** Custom dropdown that aligns with the text inputs (native <select> doesn't). */
export function ResidentSelect({
  options,
  value,
  onChange,
  placeholder = "Select a resident…",
}: {
  options: ResidentOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-left text-sm outline-none focus:border-slate-500"
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>
          {selected ? selected.name : placeholder}
        </span>
        <span className="ml-2 shrink-0 text-slate-400">▾</span>
      </button>

      {open && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  o.id === value ? "font-medium text-slate-900" : "text-slate-700"
                }`}
              >
                {o.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
