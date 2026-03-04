import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";

export default function ReviewLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
    </div>
  );
}
