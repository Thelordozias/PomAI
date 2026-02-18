// Dashboard — placeholder cards until Step 4+ fills in real content.
// Auth is enforced by AppShell; no need to re-fetch user here.

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const upcomingSections = [
  { label: "Courses",  desc: "Create and organise your courses.",          step: 4 },
  { label: "Study",    desc: "Pomodoro timer + structured captures.",       step: 5 },
  { label: "Review",   desc: "Spaced repetition flashcard queue.",          step: 6 },
  { label: "Chat",     desc: "Ask your study material (RAG, V2).",          step: 10 },
];

export default function DashboardPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-sand-200 text-xl font-semibold">Welcome back</h2>
        <p className="text-sand-500 text-sm mt-1">
          Your Study OS is ready. Features roll out step by step.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {upcomingSections.map(({ label, desc, step }) => (
          <Card key={label} padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{label}</CardTitle>
                <Badge variant="default">Step {step}</Badge>
              </div>
            </CardHeader>
            <CardBody>{desc}</CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
