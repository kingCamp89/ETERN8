import { Skeleton } from '@/components/ui/skeleton';

export default function HomeSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your home">
      {/* People row */}
      <div>
        <Skeleton className="h-5 w-28 mb-3 skeleton-shimmer rounded-lg" />
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-[68px] h-[68px] rounded-full skeleton-shimmer" />
              <Skeleton className="h-3 w-12 skeleton-shimmer rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick note */}
      <Skeleton className="h-14 w-full rounded-2xl skeleton-shimmer" />

      {/* CTA */}
      <Skeleton className="h-14 w-full rounded-2xl skeleton-shimmer" />

      {/* Memory placeholders */}
      <div>
        <Skeleton className="h-5 w-36 mb-3 skeleton-shimmer rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-2xl skeleton-shimmer" />
          <Skeleton className="h-40 w-full rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
