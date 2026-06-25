import { motion } from 'framer-motion';
import { getRandomPrompt } from '@/lib/designTokens';
import KeepsakeCard from '@/components/shared/KeepsakeCard';

export default function EmptyState({
  prompt,
  subtitle,
  illustration,
  action,
  className = '',
}) {
  const displayPrompt = prompt || getRandomPrompt();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`text-center ${className}`}
    >
      <KeepsakeCard padding={false} className="px-6 py-8">
        {illustration && (
          <div className="mb-4 flex justify-center opacity-50">
            {illustration}
          </div>
        )}
        <p className="text-quote-lg">
          &ldquo;{displayPrompt}&rdquo;
        </p>
        {subtitle && (
          <p className="text-caption mt-3 max-w-xs mx-auto">
            {subtitle}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </KeepsakeCard>
    </motion.div>
  );
}
