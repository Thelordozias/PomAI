"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 className="text-sand-200 font-semibold text-base mb-1">Something went wrong</h2>
      <p className="text-sand-500 text-sm mb-6 max-w-xs">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-ember-500/15 border border-ember-500/30 text-ember-400 text-sm font-medium hover:bg-ember-500/25 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
