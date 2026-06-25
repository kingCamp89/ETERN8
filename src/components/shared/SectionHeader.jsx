import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function SectionHeader({
  title,
  subtitle,
  action,
  actionLabel,
  actionTo,
  className,
}) {
  return (
    <div className={cn('mb-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        {action}
        {!action && actionTo && actionLabel && (
          <Link to={actionTo} className="text-link shrink-0">
            {actionLabel}
          </Link>
        )}
      </div>
      {subtitle && (
        <p className="text-caption mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
