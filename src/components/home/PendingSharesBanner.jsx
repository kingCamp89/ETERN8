import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import KeepsakeCard from '@/components/shared/KeepsakeCard';

export default function PendingSharesBanner() {
  const { data: shares = [] } = useQuery({
    queryKey: ['pendingShares'],
    queryFn: () => base44.entities.MemoryShare.filter({ status: 'pending' }),
    refetchInterval: 30000,
  });

  if (shares.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to="/shared" className="block">
        <KeepsakeCard
          interactive
          padding={false}
          className="flex items-center gap-3 p-3.5 border-primary/20 bg-primary/5"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-menu-title">
              {shares.length === 1
                ? '1 memory shared with you'
                : `${shares.length} memories shared with you`}
            </p>
            <p className="text-caption">Tap to review and accept</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </KeepsakeCard>
      </Link>
    </motion.div>
  );
}
