// Study page — Pomodoro timer + CaptureForm. Full implementation in Step 5.

import { Badge } from "@/components/ui/Badge";

export default function StudyPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sand-200 text-xl font-semibold">Study</h2>
        <Badge variant="accent">Step 5</Badge>
      </div>
      <p className="text-sand-500 text-sm">
        Pomodoro timer, session capture form (Math + Generic modes), and
        auto-concept creation coming in Step 5.
      </p>
    </div>
  );
}
