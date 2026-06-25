import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'text-[1.15rem]',
  md: 'text-[1.65rem]',
  lg: 'text-[2rem]',
  xl: 'text-[2.5rem]',
  hero: 'text-[3rem]',
};

/**
 * ETRN8 logotype — Cinzel with rose → blush → gold gradient.
 * The "8" is styled as the signature brand mark.
 */
export default function BrandWordmark({ size = 'md', className, as: Component = 'span' }) {
  return (
    <Component
      className={cn('brand-wordmark', sizeClasses[size], className)}
      aria-label="ETRN8"
    >
      <span className="brand-wordmark-letters" aria-hidden="true">ETRN</span>
      <span className="brand-wordmark-eight" aria-hidden="true">8</span>
    </Component>
  );
}
