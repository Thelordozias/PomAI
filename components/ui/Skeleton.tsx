/* Skeleton loading primitives — uses the shimmer animation from globals.css */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={["shimmer rounded-lg", className].join(" ")}
      aria-hidden="true"
    />
  );
}

/** A full card skeleton matching Card component dimensions */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-card border border-warm rounded-xl p-5 space-y-3">
      <Skeleton className="h-4 w-2/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={["h-3", i === lines - 1 ? "w-3/5" : "w-full"].join(" ")}
        />
      ))}
    </div>
  );
}

/** A single row skeleton — icon + text */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2">
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}

/** Stat box skeleton */
export function SkeletonStat() {
  return (
    <div className="bg-card border border-warm rounded-xl p-4 space-y-2">
      <Skeleton className="h-7 w-10" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
