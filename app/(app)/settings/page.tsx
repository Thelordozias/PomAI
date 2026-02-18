import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "—";
  const created = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-sand-200 text-xl font-semibold">Settings</h2>
        <p className="text-sand-500 text-sm mt-0.5">
          Account details and preferences.
        </p>
      </div>

      {/* Account */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <dt className="text-sand-500 text-sm">Email</dt>
              <dd className="text-sand-200 text-sm">{email}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sand-500 text-sm">Member since</dt>
              <dd className="text-sand-200 text-sm">{created}</dd>
            </div>
          </dl>
          <form action={signOut}>
            <Button type="submit" variant="danger" size="sm">
              Sign out
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Pomodoro defaults — static for now */}
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pomodoro</CardTitle>
            <Badge variant="default">defaults</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sand-500 text-sm">Work duration</dt>
              <dd className="text-sand-200 text-sm">25 min</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sand-500 text-sm">Break duration</dt>
              <dd className="text-sand-200 text-sm">5 min</dd>
            </div>
          </dl>
          <p className="text-sand-600 text-xs mt-4">
            Custom durations coming in a future update.
          </p>
        </CardBody>
      </Card>

      {/* Chat / RAG — V2 placeholder */}
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chat (RAG)</CardTitle>
            <Badge variant="info">V2</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sand-500 text-sm">
            Document uploads and AI-powered Q&amp;A over your study materials
            are planned for Step 9–10.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
