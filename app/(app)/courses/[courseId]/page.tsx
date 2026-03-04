import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCourse, getChapters } from "@/lib/db/queries";
import { ChapterList } from "./_components/ChapterList";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();

  const [course, chapters, { data: captureRows }, { count: totalCaptures }] = await Promise.all([
    getCourse(supabase, courseId),
    getChapters(supabase, courseId),
    supabase.from("captures").select("chapter_id, confidence").eq("course_id", courseId),
    supabase.from("captures").select("*", { count: "exact", head: true }).eq("course_id", courseId),
  ]);

  if (!course) notFound();

  // Capture count + mastered (confidence >= 3) per chapter
  const captureCounts: Record<string, number> = {};
  const masteredCounts: Record<string, number> = {};
  (captureRows ?? []).forEach((r) => {
    const row = r as { chapter_id: string | null; confidence: number };
    const key = row.chapter_id ?? "__none__";
    captureCounts[key] = (captureCounts[key] ?? 0) + 1;
    if (row.confidence >= 3) masteredCounts[key] = (masteredCounts[key] ?? 0) + 1;
  });

  return (
    <div className="max-w-2xl">
      <Link
        href="/courses"
        className="text-sand-500 text-xs hover:text-sand-200 transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← Cours
      </Link>

      <ChapterList
        course={course}
        chapters={chapters}
        captureCounts={captureCounts}
        masteredCounts={masteredCounts}
        totalCaptures={totalCaptures ?? 0}
      />
    </div>
  );
}
