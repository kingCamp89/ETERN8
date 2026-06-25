import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Clock, User } from 'lucide-react';
import SafeImage from '@/components/shared/SafeImage';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function FriendSearch({ onFriendAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentIds, setSentIds] = useState(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (query.length < 2) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await base44.functions.invoke('searchUsers', { query });
      setResults(res.data.users || []);
    } catch {
      toast.error('Search failed');
    }
    setSearching(false);
  };

  const sendMutation = useMutation({
    mutationFn: (toUserId) => base44.functions.invoke('sendFriendRequest', { toUserId }),
    onSuccess: (_, toUserId) => {
      setSentIds(prev => new Set([...prev, toUserId]));
      toast.success('Friend request sent');
      onFriendAdded?.();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Failed to send request');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search by username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="rounded-xl h-12"
        />
        <Button onClick={handleSearch} disabled={searching || query.length < 2} className="rounded-xl gap-2 shrink-0">
          <Search className="w-4 h-4" />
          {searching ? '…' : 'Search'}
        </Button>
      </div>

      <AnimatePresence>
        {hasSearched && results.length === 0 && !searching && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState
              prompt="No one found"
              subtitle="Try a different username — letters, numbers, and underscores only."
              illustration={<User className="w-8 h-8 text-primary/50" />}
            />
          </motion.div>
        )}

        {results.map((u) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <KeepsakeCard padding={false} className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                <SafeImage
                  src={u.photo_url}
                  alt=""
                  className="w-full h-full object-cover"
                  fallback={<span className="text-sm font-medium text-primary">{u.full_name?.charAt(0).toUpperCase()}</span>}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium truncate">{u.full_name}</p>
                <p className="text-caption">@{u.username}</p>
              </div>
              <Button
                size="sm"
                variant={sentIds.has(u.id) ? 'ghost' : 'outline'}
                onClick={() => sendMutation.mutate(u.id)}
                disabled={sentIds.has(u.id) || sendMutation.isPending}
                className="rounded-xl gap-1.5 shrink-0"
              >
                {sentIds.has(u.id) ? (
                  <><Clock className="w-3.5 h-3.5" /> Sent</>
                ) : (
                  <><UserPlus className="w-3.5 h-3.5" /> Add</>
                )}
              </Button>
            </KeepsakeCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
