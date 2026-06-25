import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Heart, MessageCircle, Users, UserPlus, AtSign, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCallback } from 'react';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import EmptyState from '../components/shared/EmptyState';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  share: Users,
  tag: AtSign,
  friend_request: UserPlus,
  group_invite: Users,
};

const iconStyle = {
  like: 'bg-primary/10 text-primary',
  comment: 'bg-secondary text-foreground',
  share: 'bg-primary/15 text-primary',
  tag: 'bg-secondary text-foreground',
  friend_request: 'bg-primary/10 text-primary',
  group_invite: 'bg-primary/15 text-primary',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 50),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
        await base44.entities.Notification.update(n.id, { is_read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const { indicatorRef } = usePullToRefresh(handleRefresh);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleClick = (notification) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.memory_id) {
      navigate(`/memory/${notification.memory_id}`);
    } else if (notification.group_id) {
      navigate(`/groups/${notification.group_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div ref={indicatorRef} className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10 opacity-0 transition-all">
        <LoadingSpinner size="sm" className="mt-2 bg-card shadow depth-card p-1.5 rounded-full" />
      </div>

      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        showBack
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              className="text-caption text-primary font-medium hover:underline"
            >
              Mark all read
            </button>
          ) : null
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <AnimatePresence>
          {notifications.length === 0 ? (
            <EmptyState
              prompt="Quiet for now"
              subtitle="When someone interacts with your memories, you'll see it here."
              illustration={<Bell className="w-8 h-8 text-primary/50" />}
            />
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, i) => {
                const Icon = iconMap[notification.type] || Bell;
                const style = iconStyle[notification.type] || 'bg-secondary text-muted-foreground';
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <KeepsakeCard
                      padding={false}
                      interactive
                      className={cn(
                        'flex items-start gap-3 p-3 group cursor-pointer',
                        !notification.is_read && 'border-primary/20 bg-primary/5',
                      )}
                      onClick={() => handleClick(notification)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleClick(notification)}
                    >
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', style)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-body leading-relaxed flex-1">{notification.message}</p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-caption mt-0.5">
                          {format(new Date(notification.created_date), "MMM d 'at' h:mm a")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notification.id); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </KeepsakeCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
