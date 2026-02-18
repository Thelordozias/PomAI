// Settings page — user preferences. Fleshed out progressively.

import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-sand-200 text-xl font-semibold">Settings</h2>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-4">More account settings coming as features are added.</p>
          <form action={signOut}>
            <Button type="submit" variant="danger" size="sm">
              Sign out
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
