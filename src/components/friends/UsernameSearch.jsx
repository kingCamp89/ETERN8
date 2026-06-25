import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsernameSearch({ onSelect, selectedIds = [], existingMemberIds = [] }) {
  const [query, setQuery] = useState('');
  const [addedUsers, setAddedUsers] = useState([]);

  const { data: searchData, isLoading } = useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => base44.functions.invoke('searchUsers', { query }),
    enabled: query.length >= 2,
  });

  const results = (searchData?.data?.users || []).filter(
    u => !existingMemberIds.includes(u.id)
  );

  const handleSelect = (user) => {
    const alreadyAdded = selectedIds.includes(user.id) || addedUsers.some(a => a.id === user.id);
    if (!alreadyAdded) {
      setAddedUsers(prev => [...prev, user]);
      onSelect({
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        photo_url: user.photo_url,
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      <AnimatePresence>
        {query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                No users found
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {results.map((user) => {
                  const isSelected = selectedIds.includes(user.id) || addedUsers.some(a => a.id === user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => !isSelected && handleSelect(user)}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                        isSelected
                          ? 'bg-primary/5 border-primary/20 opacity-60 cursor-default'
                          : 'bg-card border-border/50 hover:bg-secondary/50 cursor-pointer'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {user.photo_url ? (
                          <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-primary">
                            {user.full_name?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <UserPlus className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}