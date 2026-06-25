import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { BrandGift, BrandSparkle } from '@/components/shared/BrandIcons';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { format } from 'date-fns';

export default function TodaysDeliveries() {
  const { data: memories = [] } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id });
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysMemories = memories.filter(m => {
    if (!m.is_scheduled || !m.scheduled_date) return false;
    if (m.delivery_status !== 'delivered') return false;
    const scheduled = new Date(m.scheduled_date);
    scheduled.setHours(0, 0, 0, 0);
    return scheduled <= today;
  });

  if (todaysMemories.length === 0) return null;

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
          className="delivery-card-accent bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/30 border-primary/15 p-3.5 relative"
        >
          <BrandSparkle className="absolute top-3 right-3 w-4 h-4 opacity-30" />

          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
              <BrandGift className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-card-title">
                {todaysMemories.length === 1 ? 'Arrived today' : `${todaysMemories.length} arrived today`}
              </h3>
              <p className="text-caption">{format(today, 'MMMM d')}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {todaysMemories.slice(0, 3).map((memory) => (
              <Link key={memory.id} to={`/memory/${memory.id}`}>
                <div className="delivery-item-row flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors group">
                  <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-menu-title truncate">{memory.title}</p>
                    {memory.loved_one_name && (
                      <p className="text-caption truncate">
                        For {memory.loved_one_name}
                        {memory.scheduled_occasion && ` · ${memory.scheduled_occasion}`}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          {todaysMemories.length > 3 && (
            <p className="text-caption text-center mt-2">
              +{todaysMemories.length - 3} more waiting
            </p>
          )}
        </KeepsakeCard>
      </motion.div>
    </AnimatePresence>
  );
}