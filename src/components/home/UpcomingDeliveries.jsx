import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { BrandClock } from '@/components/shared/BrandIcons';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { format, differenceInCalendarDays } from 'date-fns';

export default function UpcomingDeliveries() {
  const { data: memories = [] } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id });
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingMemories = memories
    .filter(m => {
      if (!m.is_scheduled || !m.scheduled_date) return false;
      if (m.delivery_status === 'delivered' || m.delivery_status === 'cancelled') return false;
      const scheduled = new Date(m.scheduled_date);
      scheduled.setHours(0, 0, 0, 0);
      const diff = differenceInCalendarDays(scheduled, today);
      // Show memories due within the next 2 days (today, tomorrow, day after)
      return diff >= 0 && diff <= 2;
    })
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  if (upcomingMemories.length === 0) return null;

  const getDueLabel = (scheduledDate) => {
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(0, 0, 0, 0);
    const diff = differenceInCalendarDays(scheduled, today);
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due ${format(scheduled, 'EEEE')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-0"
      >
        <KeepsakeCard
          padding={false}
          className="delivery-card-accent bg-gradient-to-br from-primary/8 via-secondary/20 to-accent/40 border-border/60 p-3.5"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BrandClock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-card-title">
                {upcomingMemories.length === 1 ? 'Due for delivery' : `${upcomingMemories.length} due soon`}
              </h3>
              <p className="text-caption">Coming up</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {upcomingMemories.slice(0, 3).map((memory) => (
              <Link key={memory.id} to={`/memory/${memory.id}`}>
                <div className="delivery-item-row flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors group">
                  <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-menu-title truncate">{memory.title}</p>
                    <p className="text-caption truncate">
                      {memory.loved_one_name && `For ${memory.loved_one_name} · `}
                      <span className="text-primary font-medium">{getDueLabel(memory.scheduled_date)}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          {upcomingMemories.length > 3 && (
            <p className="text-caption text-center mt-2">
              +{upcomingMemories.length - 3} more
            </p>
          )}
        </KeepsakeCard>
      </motion.div>
    </AnimatePresence>
  );
}