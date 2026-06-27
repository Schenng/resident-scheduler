"use client";

import { useState } from "react";

/** Placeholder action — scanning an existing schedule isn't built yet. */
export function ScanScheduleButton() {
  const [showSoon, setShowSoon] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowSoon(true)}
        className="w-full rounded-lg bg-slate-200 px-5 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-300"
      >
        Scan existing schedule
      </button>

      {showSoon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setShowSoon(false)}
        >
          <div
            className="w-full max-w-xs space-y-4 rounded-xl bg-white p-5 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-slate-900">Coming soon</h2>
            <p className="text-sm text-slate-500">
              Scanning an existing paper or photo schedule isn&apos;t available yet.
            </p>
            <button
              onClick={() => setShowSoon(false)}
              className="w-full rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
