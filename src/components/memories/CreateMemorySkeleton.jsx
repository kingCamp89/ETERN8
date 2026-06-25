import { Skeleton } from '@/components/ui/skeleton';

export default function CreateMemorySkeleton() {
  return (
    <div className="page-sections pb-8" aria-busy="true" aria-label="Loading memory">
      <Skeleton className="h-20 w-full rounded-2xl skeleton-shimmer" />
      <Skeleton className="h-36 w-full rounded-2xl skeleton-shimmer" />
      <Skeleton className="h-48 w-full rounded-2xl skeleton-shimmer" />
      <Skeleton className="h-32 w-full rounded-2xl skeleton-shimmer" />
      <Skeleton className="h-14 w-full rounded-xl skeleton-shimmer" />
    </div>
  );
}
