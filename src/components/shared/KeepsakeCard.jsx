import { cn } from '@/lib/utils';

/**
 * Premium layered card surface — memories, empty states, home blocks.
 */
export default function KeepsakeCard({
  children,
  className,
  interactive = false,
  padding = true,
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={cn(
        'keepsake-card rounded-2xl',
        padding && 'p-5',
        interactive && [
          'transition-all duration-300 ease-out',
          'hover:shadow-md hover:-translate-y-0.5',
          'active:scale-[0.99] active:translate-y-0',
        ],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
