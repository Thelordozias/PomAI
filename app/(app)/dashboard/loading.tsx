import { SkeletonCard, SkeletonStat, Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse-none">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* XP bar */}
      <div className="bg-card border border-warm rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>

      {/* Cards */}
      <SkeletonCard lines={4} />
      <SkeletonCard lines={2} />
    </div>
  );
}
