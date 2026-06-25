import { motion } from 'framer-motion';
import Logo from '@/components/shared/Logo';
import BrandWordmark from '@/components/shared/BrandWordmark';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { cn } from '@/lib/utils';

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <p className="text-sm text-destructive bg-destructive/5 border border-destructive/15 rounded-xl px-3 py-2.5 text-center">
      {children}
    </p>
  );
}

export default function AuthLayout({ tagline, footer, children, className }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-gradient-warm">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
        className={cn('w-full max-w-sm', className)}
      >
        <div className="text-center mb-6">
          <Logo size="lg" className="mx-auto mb-3" />
          <BrandWordmark as="h1" size="lg" className="justify-center" />
          {tagline && (
            <p className="text-quote mt-3 max-w-xs mx-auto">{tagline}</p>
          )}
        </div>

        <KeepsakeCard>{children}</KeepsakeCard>

        {footer && (
          <p className="text-center text-caption mt-6">{footer}</p>
        )}
      </motion.div>
    </div>
  );
}
