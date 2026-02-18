import { createClient } from "@/lib/supabase/server";
import { getCourses } from "@/lib/db/queries";
import { CourseList } from "./_components/CourseList";

export default async function CoursesPage() {
  const supabase = await createClient();
  const courses = await getCourses(supabase);

  return (
    <div className="max-w-4xl">
      <CourseList courses={courses} />
    </div>
  );
}
