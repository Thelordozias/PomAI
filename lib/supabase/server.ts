// Server-side Supabase client.
// Use in Server Components, Server Actions, and Route Handlers.
// Reads/writes cookies via next/headers — must NOT be used in Client Components.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can throw in Server Components that don't own the response.
            // Middleware handles session refresh separately so this is safe to ignore.
          }
        },
      },
    }
  );
}
