// Courses list — full implementation in Step 4.

import { Badge } from "@/components/ui/Badge";

export default function CoursesPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sand-200 text-xl font-semibold">Courses</h2>
        <Badge variant="accent">Step 4</Badge>
      </div>
      <p className="text-sand-500 text-sm">
        Course list, create/edit, and chapter management coming in Step 4.
      </p>
    </div>
  );
}
