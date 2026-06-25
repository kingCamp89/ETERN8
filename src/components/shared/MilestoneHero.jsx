import { motion } from 'framer-motion';

export default function MilestoneHero({
  title,
  subtitle,
  date,
  children,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-cinematic milestone-particles border border-primary/10 depth-card px-8 py-12 text-center ${className}`}
    >
      {date && (
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          {date}
        </p>
      )}
      <h1 className="font-heading text-3xl font-bold text-foreground leading-tight mb-3">
        {title}
      </h1>
      {subtitle && (
        <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-8">{children}</div>}
    </motion.div>
  );
}
