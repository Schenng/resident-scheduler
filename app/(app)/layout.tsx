import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TabNav } from "@/components/ui/TabNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-slate-50">
      <div className="flex-1">{children}</div>
      <TabNav />
    </div>
  );
}
