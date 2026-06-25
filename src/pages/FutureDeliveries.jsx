import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import EmptyState from '../components/shared/EmptyState';
import DeliveryPreviewDialog from '../components/deliveries/DeliveryPreviewDialog';
import { format, differenceInDays } from 'date-fns';
import { Clock, Gift, Calendar, Eye, Layers, AlarmClock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function StatusPill({ children, variant = 'neutral' }) {
  const styles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-primary/15 text-primary',
    warning: 'bg-secondary text-foreground',
    neutral: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

export default function FutureDeliveries() {
  const [previewGroup, setPreviewGroup] = useState(null);
  const { data: memories = [] } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id });
    },
  });

  const scheduled = memories
    .filter(m => m.is_scheduled && m.scheduled_date)
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  const dateGroups = scheduled.reduce((acc, memory) => {
    if (!acc[memory.scheduled_date]) acc[memory.scheduled_date] = [];
    acc[memory.scheduled_date].push(memory);
    return acc;
  }, {});

  const groupEntries = Object.entries(dateGroups).sort(
    ([a], [b]) => new Date(a) - new Date(b),
  );

  const getGroupStatus = (date, groupMemories) => {
    const daysUntil = differenceInDays(new Date(date), new Date());
    const isPast = daysUntil < 0;
    const isToday = daysUntil === 0;
    const allDelivered = groupMemories.every(m => m.delivery_status === 'delivered');
    const anyDelivered = groupMemories.some(m => m.delivery_status === 'delivered');

    if (isToday && allDelivered) return { label: 'Sent', variant: 'success' };
    if (isToday && anyDelivered && !allDelivered) return { label: 'In progress', variant: 'warning' };
    if (isToday && !anyDelivered) return { label: 'Today', variant: 'primary' };
    if (isPast && allDelivered) return { label: 'Sent', variant: 'success' };
    if (isPast && !allDelivered) return { label: 'Pending', variant: 'warning' };
    if (!isPast) return { label: `${daysUntil} days`, variant: 'primary' };
    return null;
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Future deliveries" subtitle="Memories waiting for their moment" showBack />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        {groupEntries.length > 0 ? (
          <div className="space-y-5">
            {groupEntries.map(([date, groupMemories], gi) => {
              const isMulti = groupMemories.length > 1;
              const status = getGroupStatus(date, groupMemories);
              const isPast = differenceInDays(new Date(date), new Date()) < 0;

              return (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.05 }}
                >
                  <div className="flex items-center gap-2 mb-2 px-1 flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-overline normal-case tracking-normal text-muted-foreground">
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </span>
                    {isMulti && (
                      <span className="ml-auto">
                        <StatusPill variant="primary">
                          <Layers className="w-3 h-3" />
                          {groupMemories.length} messages · 1 email
                        </StatusPill>
                      </span>
                    )}
                    {status && !isMulti && (
                      <span className="ml-auto">
                        <StatusPill variant={status.variant}>{status.label}</StatusPill>
                      </span>
                    )}
                  </div>

                  <KeepsakeCard padding={false} className="overflow-hidden">
                    {groupMemories.map((memory, mi) => (
                      <Link key={memory.id} to={`/memory/${memory.id}`} className="block">
                        <div className={`delivery-item-row p-4 hover:bg-secondary/30 transition-colors ${mi > 0 ? 'border-t border-border/30' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isPast ? 'bg-primary/15' : 'bg-primary/10'
                            }`}>
                              <Gift className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-section-title truncate">
                                {memory.title}
                              </h3>
                              <p className="text-caption mt-0.5">
                                For {memory.loved_one_name || 'someone special'}
                                {memory.scheduled_occasion && ` · ${memory.scheduled_occasion}`}
                              </p>
                              {memory.scheduled_time && (
                                <p className="text-caption flex items-center gap-0.5 mt-0.5">
                                  <AlarmClock className="w-3 h-3" /> {memory.scheduled_time}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPreviewGroup({ date, memories: groupMemories })}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-caption text-primary font-medium bg-primary/5 hover:bg-primary/10 transition-colors border-t border-border/30"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview {isMulti ? `${groupMemories.length} messages as 1 email` : 'delivery'}
                    </button>
                  </KeepsakeCard>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            prompt="Some messages are worth waiting for"
            subtitle="When you create a memory, schedule it for a special future date."
            illustration={<Clock className="w-8 h-8 text-primary/50" />}
            action={
              <Link
                to="/create"
                className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-body font-medium hover:bg-primary/90 transition-colors"
              >
                Schedule a memory
              </Link>
            }
          />
        )}
      </motion.div>

      <DeliveryPreviewDialog
        group={previewGroup}
        open={!!previewGroup}
        onOpenChange={(open) => { if (!open) setPreviewGroup(null); }}
      />
    </div>
  );
}
