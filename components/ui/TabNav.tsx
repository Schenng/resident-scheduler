"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/schedule", label: "Schedule" },
  { href: "/previous", label: "Previous" },
  { href: "/residents", label: "Residents" },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-3 border-t border-slate-200 bg-white">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`py-3 text-center text-sm font-medium transition ${
              active
                ? "text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span
              className={`inline-block border-b-2 pb-0.5 ${
                active ? "border-slate-900" : "border-transparent"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
