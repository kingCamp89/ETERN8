import KeepsakeCard from '@/components/shared/KeepsakeCard';

export default function MemoryDetailSkeleton() {
  return (
    <div className="page-sections pb-8" aria-hidden="true">
      <div className="skeleton-shimmer h-56 rounded-2xl" />
      <KeepsakeCard padding={false} className="overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-3 w-28 rounded-full" />
              <div className="skeleton-shimmer h-2.5 w-40 rounded-full" />
            </div>
          </div>
          <div className="skeleton-shimmer h-7 w-[80%] rounded-lg" />
          <div className="flex gap-2">
            <div className="skeleton-shimmer h-6 w-16 rounded-full" />
            <div className="skeleton-shimmer h-6 w-28 rounded-full" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="skeleton-shimmer h-3 w-full rounded-full" />
            <div className="skeleton-shimmer h-3 w-full rounded-full" />
            <div className="skeleton-shimmer h-3 w-2/3 rounded-full" />
          </div>
        </div>
      </KeepsakeCard>
    </div>
  );
}
