import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { BrandClock } from '@/components/shared/BrandIcons';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { Link } from 'react-router-dom';

export default function MemoryReflection({ memory }) {
  if (!memory) return null;

  const memoryDate = new Date(memory.memory_date || memory.created_date);
  const years = differenceInYears(new Date(), memoryDate);
  const months = differenceInMonths(new Date(), memoryDate) % 12;

  let timeAgo = '';
  if (years > 0) timeAgo = `${years} year${years > 1 ? 's' : ''} ago`;
  else if (months > 0) timeAgo = `${months} month${months > 1 ? 's' : ''} ago`;
  else timeAgo = 'Recently';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
    >
      <Link to={`/memory/${memory.id}`}>
        <KeepsakeCard
          interactive
          padding={false}
          className="relative overflow-hidden bg-gradient-to-br from-primary/6 to-secondary/30 border-primary/10 p-5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
          
          <div className="flex items-center gap-2 text-primary mb-3">
            <BrandClock className="w-4 h-4" />
            <span className="text-overline text-primary normal-case tracking-normal font-medium">
              {timeAgo} today
            </span>
          </div>

          <p className="text-quote line-clamp-3">
            &ldquo;{memory.content || memory.title}&rdquo;
          </p>

          <div className="flex items-center justify-between mt-3">
            <span className="text-caption">
              {memory.loved_one_name && `For ${memory.loved_one_name} · `}
              {format(memoryDate, 'MMM d, yyyy')}
            </span>
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
        </KeepsakeCard>
      </Link>
    </motion.div>
  );
}