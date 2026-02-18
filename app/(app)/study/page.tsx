import { createClient } from "@/lib/supabase/server";
import { getCourses, getChapters, getCaptures } from "@/lib/db/queries";
import { StudyClient } from "./_components/StudyClient";

interface Props {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function StudyPage({ searchParams }: Props) {
  const { courseId } = await searchParams;
  const supabase = await createClient();

  const [courses, chapters, captures] = await Promise.all([
    getCourses(supabase),
    courseId ? getChapters(supabase, courseId) : Promise.resolve([]),
    courseId ? getCaptures(supabase, courseId, 20) : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-3xl">
      <StudyClient
        courses={courses}
        chapters={chapters}
        captures={captures}
        selectedCourseId={courseId ?? ""}
      />
    </div>
  );
}
