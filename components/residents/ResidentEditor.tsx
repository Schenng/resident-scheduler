"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateResident, setResidentActive } from "@/app/(app)/residents/actions";
import { residentFullName, type Resident } from "@/types";

export function ResidentEditor({ resident }: { resident: Resident }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(resident.first_name);
  const [lastName, setLastName] = useState(resident.last_name);
  const [level, setLevel] = useState(resident.level ?? "");
  const [pending, startTransition] = useTransition();

  const valid = firstName.trim() !== "" && lastName.trim() !== "";

  function save() {
    if (!valid) return;
    startTransition(async () => {
      await updateResident(resident.id, firstName, lastName, level);
      setEditing(false);
    });
  }

  function toggleActive() {
    startTransition(async () => {
      await setResidentActive(resident.id, !resident.active);
      if (!resident.active) router.refresh();
      else router.push("/residents");
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <div>
          <p className="font-semibold text-slate-900">{residentFullName(resident)}</p>
          <p className="text-sm text-slate-500">
            {resident.level ?? "No level set"}
            {!resident.active && " · inactive"}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <button
            onClick={() => setEditing(true)}
            className="text-slate-500 hover:text-slate-700"
          >
            Edit
          </button>
          <button
            onClick={toggleActive}
            disabled={pending}
            className={resident.active ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"}
          >
            {resident.active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First name"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last name"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
      />
      <input
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        placeholder="Level"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={pending || !valid}
          className="flex-1 rounded-lg bg-slate-800 py-2 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setFirstName(resident.first_name);
            setLastName(resident.last_name);
            setLevel(resident.level ?? "");
          }}
          className="rounded-lg px-4 py-2 text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
