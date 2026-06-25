import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-10 h-10 border-[3px]',
};

export default function LoadingSpinner({ size = 'md', className }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'rounded-full border-primary/25 border-t-primary animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}
