import { Skeleton } from "@/components/ui/Skeleton";

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl gap-4">
      <Skeleton className="h-6 w-24" />

      {/* Message bubbles */}
      <div className="flex-1 space-y-4 py-4">
        <div className="flex justify-end">
          <Skeleton className="h-12 w-2/3 rounded-xl" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-20 w-3/4 rounded-xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-1/2 rounded-xl" />
        </div>
      </div>

      {/* Input */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
