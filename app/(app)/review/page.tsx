// Review page — flashcard player + spaced repetition queue. Steps 6–7.

import { Badge } from "@/components/ui/Badge";

export default function ReviewPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sand-200 text-xl font-semibold">Review</h2>
        <Badge variant="accent">Steps 6–7</Badge>
      </div>
      <p className="text-sand-500 text-sm">
        Today&apos;s review queue, FlashcardPlayer (Know / Hard / Miss), and
        spaced repetition scheduler coming in Steps 6–7.
      </p>
    </div>
  );
}
