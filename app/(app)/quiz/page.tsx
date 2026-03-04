import { createClient } from "@/lib/supabase/server";
import { getCourses } from "@/lib/db/queries";
import { QuizClient } from "./_components/QuizClient";

export default async function QuizPage() {
  const supabase = await createClient();
  const courses = await getCourses(supabase);

  return (
    <div className="max-w-2xl">
      <QuizClient courses={courses} />
    </div>
  );
}
