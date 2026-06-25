import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function NotificationBell({ className }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const { data: friendRequests = [] } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: () => base44.functions.invoke('getMyPendingRequests'),
  });

  const pendingRequests = friendRequests?.data?.requests?.length || 0;
  const totalBadge = unreadCount + pendingRequests;

  return (
    <Link to="/notifications" className={cn('relative block', className)} aria-label="Notifications">
      <motion.div
        whileTap={{ scale: 0.92 }}
        className="w-10 h-10 rounded-xl bg-card/80 border border-border/40 flex items-center justify-center hover:bg-secondary/60 transition-colors depth-card"
      >
        <Bell className="w-[18px] h-[18px] text-muted-foreground" />
      </motion.div>
      {totalBadge > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground px-1 shadow-sm ring-2 ring-card',
            totalBadge > 9 && 'text-[9px]'
          )}
        >
          {totalBadge > 99 ? '99+' : totalBadge}
        </span>
      )}
    </Link>
  );
}
