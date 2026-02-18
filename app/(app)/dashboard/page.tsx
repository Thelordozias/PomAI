// Dashboard — placeholder until Step 3 (AppShell) and Step 4 (Courses).
// Already auth-aware: shows user email + sign-out.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this, but belt-and-suspenders
  if (!user) redirect("/login");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-sand-200 text-2xl font-semibold">Dashboard</h1>
      <p className="text-sand-500 text-sm">
        Signed in as <span className="text-ember-500">{user.email}</span>
      </p>
      <p className="text-sand-600 text-xs">AppShell and content coming in Step 3.</p>

      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          Sign out
        </Button>
      </form>
    </main>
  );
}
