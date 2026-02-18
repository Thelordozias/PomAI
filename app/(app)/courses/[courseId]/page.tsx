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

  const [course, chapters] = await Promise.all([
    getCourse(supabase, courseId),
    getChapters(supabase, courseId),
  ]);

  if (!course) notFound();

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <Link
        href="/courses"
        className="text-sand-500 text-xs hover:text-sand-200 transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← Courses
      </Link>

      <ChapterList course={course} chapters={chapters} />
    </div>
  );
}
