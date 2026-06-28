import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, isSameDay, subYears, subMonths, subWeeks } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { BrandCalendar } from '@/components/shared/BrandIcons';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import EmotionBadge from '../shared/EmotionBadge';

const periods = [
  { key: 'year', label: 'This time last year' },
  { key: 'month', label: 'This time last month' },
  { key: 'week', label: 'This time last week' },
];

export default function OnThisDay() {
  const [period, setPeriod] = useState('year');

  const { data: memories = [] } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id }, '-memory_date');
    },
  });

  const today = new Date();
  let onThisDayMemories = [];

  if (period === 'year') {
    onThisDayMemories = memories.filter(m => {
      const d = new Date(m.memory_date || m.created_date);
      return isSameDay(d, subYears(today, 1)) ||
        isSameDay(d, subYears(today, 2)) ||
        isSameDay(d, subYears(today, 3));
    });
  } else if (period === 'month') {
    onThisDayMemories = memories.filter(m => {
      const d = new Date(m.memory_date || m.created_date);
      return isSameDay(d, subMonths(today, 1)) ||
        isSameDay(d, subMonths(today, 2)) ||
        isSameDay(d, subMonths(today, 3)) ||
        isSameDay(d, subMonths(today, 6));
    });
  } else {
    onThisDayMemories = memories.filter(m => {
      const d = new Date(m.memory_date || m.created_date);
      return isSameDay(d, subWeeks(today, 1)) ||
        isSameDay(d, subWeeks(today, 2)) ||
        isSameDay(d, subWeeks(today, 4));
    });
  }

  if (onThisDayMemories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <KeepsakeCard padding={false} className="border-primary/15 overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-border/25">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BrandCalendar className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-section-title mb-0">On this day</h3>
          </div>

          <div className="flex gap-1 mt-3 flex-wrap">
            {periods.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`text-caption font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  period === p.key
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Memory list */}
        <div className="divide-y divide-border/30">
          <AnimatePresence mode="wait">
            {onThisDayMemories.slice(0, 3).map((memory) => (
              <motion.div
                key={memory.id + period}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Link to={`/memory/${memory.id}`} className="block">
                  <div className="px-4 py-3 hover:bg-secondary/40 transition-colors flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-caption text-muted-foreground">
                          {format(new Date(memory.memory_date || memory.created_date), 'MMMM d, yyyy')}
                        </span>
                        {memory.emotion && <EmotionBadge emotion={memory.emotion} />}
                      </div>
                      <p className="text-body font-medium line-clamp-1">{memory.title}</p>
                      {memory.content && (
                        <p className="text-caption line-clamp-2 mt-0.5">{memory.content}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </KeepsakeCard>
    </motion.div>
  );
}