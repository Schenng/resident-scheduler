import { signOut } from "@/app/auth/actions";

export function AppHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-400 hover:text-slate-700"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
