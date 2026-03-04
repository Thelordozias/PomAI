import { createClient } from "@/lib/supabase/server";
import { getCourses } from "@/lib/db/queries";
import { ChatClient } from "./_components/ChatClient";

export default async function ChatPage() {
  const supabase = await createClient();
  const courses = await getCourses(supabase);

  return (
    <div className="max-w-3xl">
      <ChatClient courses={courses} />
    </div>
  );
}
