import KeepsakeCard from '@/components/shared/KeepsakeCard';

export default function ProfileDetailSkeleton() {
  return (
    <div className="page-sections pb-8" aria-busy="true" aria-label="Loading profile">
      <KeepsakeCard padding={false} className="p-6 text-center">
        <div className="skeleton-shimmer w-24 h-24 rounded-full mx-auto mb-4" />
        <div className="skeleton-shimmer h-7 w-40 rounded-lg mx-auto mb-2" />
        <div className="skeleton-shimmer h-4 w-56 rounded-full mx-auto mb-5" />
        <div className="flex justify-center gap-8">
          <div className="space-y-2">
            <div className="skeleton-shimmer h-6 w-10 rounded-md mx-auto" />
            <div className="skeleton-shimmer h-3 w-14 rounded-full mx-auto" />
          </div>
          <div className="space-y-2">
            <div className="skeleton-shimmer h-6 w-10 rounded-md mx-auto" />
            <div className="skeleton-shimmer h-3 w-14 rounded-full mx-auto" />
          </div>
        </div>
      </KeepsakeCard>
      <div className="skeleton-shimmer h-10 rounded-xl" />
      <KeepsakeCard padding={false} className="p-4 space-y-3">
        <div className="skeleton-shimmer h-5 w-16 rounded-md" />
        <div className="skeleton-shimmer h-28 rounded-2xl" />
        <div className="skeleton-shimmer h-28 rounded-2xl" />
      </KeepsakeCard>
    </div>
  );
}
