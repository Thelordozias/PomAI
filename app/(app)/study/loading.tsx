import { SkeletonCard, Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function StudyLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-6 w-28" />

      {/* Pomodoro timer skeleton */}
      <div className="bg-card border border-warm rounded-xl p-6 flex flex-col items-center gap-4">
        <Skeleton className="h-20 w-40 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Capture form skeleton */}
      <SkeletonCard lines={5} />

      {/* Recent captures */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
