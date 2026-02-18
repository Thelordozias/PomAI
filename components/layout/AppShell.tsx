// Server Component — fetches the authed user once here so Sidebar can show email.
// Renders the desktop/mobile chrome; children land in the scrollable content area.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Topbar } from "./Topbar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email ?? "unknown";

  return (
    <div className="min-h-screen bg-bark-900">
      {/* Desktop sidebar */}
      <Sidebar userEmail={email} />

      {/* Main column — offset by sidebar width on desktop */}
      <div className="md:ml-56 flex flex-col min-h-screen">
        <Topbar />

        {/* Scrollable page content */}
        <main
          className="
            flex-1 overflow-y-auto
            px-4 md:px-8 py-6
            pb-20 md:pb-8   /* extra bottom padding on mobile for MobileNav */
          "
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
