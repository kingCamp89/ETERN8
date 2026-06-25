import { motion } from 'framer-motion';
import { useState } from 'react';
import Logo from '@/components/shared/Logo';
import BrandWordmark from '@/components/shared/BrandWordmark';
import NotificationBell from '@/components/shared/NotificationBell';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { getWelcomeGreeting } from '@/lib/designTokens';

export default function WelcomeHeader() {
  const [greeting] = useState(() => getWelcomeGreeting());

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="pt-6 pb-1"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
          >
            <Logo size="sm" className="drop-shadow-md" />
          </motion.div>
          <div className="min-w-0">
            <BrandWordmark as="h1" size="lg" />
            <p className="text-quote mt-0.5">
              Preserve what matters most
            </p>
          </div>
        </div>
        <NotificationBell className="shrink-0 mt-0.5" />
      </div>

      <KeepsakeCard
        padding={false}
        className="mt-5 px-5 py-4 glass-warm border-border/30"
      >
        <p className="text-quote text-center">
          &ldquo;{greeting}&rdquo;
        </p>
      </KeepsakeCard>
    </motion.header>
  );
}
