// Auth pages share this centered, branded layout.
// Force dynamic rendering — env vars (Supabase URL) are not available at build time.
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bark-900">
      {/* Wordmark */}
      <div className="mb-8 flex items-center gap-1.5">
        <span className="text-accent text-2xl font-bold tracking-tight">Pom</span>
        <span className="text-sand-200 text-2xl font-bold tracking-tight">AI</span>
      </div>
      {children}
    </div>
  );
}
