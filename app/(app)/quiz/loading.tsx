import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";

export default function QuizLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-64" />
      </div>
      <SkeletonCard lines={4} />
    </div>
  );
}
