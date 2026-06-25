import SafeImage from './SafeImage';
import { cn } from '@/lib/utils';

const sizes = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-9 h-9 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export default function ProfileAvatar({
  src,
  alt = '',
  name,
  size = 'md',
  className = '',
  glow = true,
}) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div
      className={cn(
        sizes[size],
        'rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center',
        'bg-gradient-to-br from-primary/15 to-accent/20',
        glow && 'ring-glow',
        className,
      )}
    >
      <SafeImage
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        fallback={
          <span className="font-heading font-semibold text-primary">{initial}</span>
        }
      />
    </div>
  );
}
