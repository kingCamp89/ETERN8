import { Link } from 'react-router-dom';
import useLovedOnes from '../../hooks/useLovedOnes';
import { motion } from 'framer-motion';
import { User, Link2 } from 'lucide-react';
import SafeImage from '@/components/shared/SafeImage';

export default function LinkedProfiles({ profileIds, currentId }) {
  const { data: allLovedOnes = [] } = useLovedOnes();

  const linked = allLovedOnes.filter(p => profileIds.includes(p.id) && p.id !== currentId);

  if (linked.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-5 pt-4 border-t border-border/30"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Connected Profiles</span>
      </div>
      <div className="flex justify-center gap-3">
        {linked.map(p => (
          <Link key={p.id} to={`/profile/${p.id}`}>
            <div className="flex flex-col items-center gap-1 group">
              <div className="w-12 h-12 rounded-full bg-secondary border-2 border-primary/10 overflow-hidden flex items-center justify-center group-hover:border-primary/30 transition-colors">
                <SafeImage src={p.photo_url} alt={p.name} className="w-full h-full object-cover" fallback={<User className="w-5 h-5 text-muted-foreground" />} />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {p.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}