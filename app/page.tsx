// Root landing — will redirect to /dashboard after auth is wired (Step 2).
// For now, renders a minimal branded placeholder.

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* Wordmark */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-accent text-3xl font-bold tracking-tight">Pom</span>
        <span className="text-sand-200 text-3xl font-bold tracking-tight">AI</span>
      </div>

      {/* Tagline */}
      <p className="text-sand-500 text-lg max-w-sm mb-10">
        Focus. Capture. Master.
        <br />
        Your academic study operating system.
      </p>

      {/* CTA — links to /dashboard (unprotected until Step 2) */}
      <Link
        href="/dashboard"
        className="
          inline-block px-6 py-3 rounded
          bg-ember-500 text-sand-50 font-medium
          hover:bg-ember-600
          transition-colors duration-150
        "
      >
        Open Study OS
      </Link>

      <p className="mt-6 text-sand-600 text-sm">
        Auth coming in Step 2.
      </p>
    </main>
  );
}
