import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '@/components/shared/SafeImage';

function idsMatch(a, b) {
  return String(a) === String(b);
}

function includesFriendId(ids, friendId) {
  return (ids || []).some((id) => idsMatch(id, friendId));
}

export default function ShareOptions({
  shareWithIds,
  shareGroupIds,
  shareText,
  sharePhoto,
  shareVoice,
  shareVideo,
  defaultExpandFriends = false,
  prefilledFriends = [],
  onChange,
}) {
  const [showFriends, setShowFriends] = useState(defaultExpandFriends);
  const [showGroups, setShowGroups] = useState(false);

  useEffect(() => {
    if (defaultExpandFriends && (shareWithIds?.length || 0) > 0) {
      setShowFriends(true);
    }
  }, [defaultExpandFriends, shareWithIds]);

  const { data: friendsData } = useQuery({
    queryKey: ['myFriends'],
    queryFn: () => base44.functions.invoke('getMyFriends'),
  });
  const friends = useMemo(() => {
    const byId = new Map((friendsData?.data?.friends || []).map((f) => [f.id, f]));
    for (const friend of prefilledFriends) {
      if (friend?.id && !byId.has(friend.id)) byId.set(friend.id, friend);
    }
    return [...byId.values()];
  }, [friendsData, prefilledFriends]);

  const { data: groups = [] } = useQuery({
    queryKey: ['memoryGroups'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getMyGroups', {});
      return data?.groups || [];
    },
  });

  const toggleFriend = (userId) => {
    const current = shareWithIds || [];
    const updated = includesFriendId(current, userId)
      ? current.filter((id) => !idsMatch(id, userId))
      : [...current, userId];
    onChange({ share_with_ids: updated });
  };

  const toggleGroup = (groupId) => {
    const current = shareGroupIds || [];
    const updated = current.includes(groupId)
      ? current.filter(id => id !== groupId)
      : [...current, groupId];
    onChange({ share_group_ids: updated });
  };

  const hasSharing = (shareWithIds?.length || 0) + (shareGroupIds?.length || 0) > 0;

  const selectedFriends = useMemo(() => {
    const ids = shareWithIds || [];
    const fromList = friends.filter((f) => includesFriendId(ids, f.id));
    const missingIds = ids.filter((id) => !fromList.some((f) => idsMatch(f.id, id)));
    const placeholders = missingIds.map((id) => {
      const prefilled = prefilledFriends.find((p) => idsMatch(p.id, id));
      return prefilled || { id, full_name: 'Friend' };
    });
    return [...fromList, ...placeholders];
  }, [friends, shareWithIds, prefilledFriends]);
  const selectedGroups = groups.filter(g => (shareGroupIds || []).includes(g.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Share this with</span>
      </div>

      <AnimatePresence>
        {hasSharing && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-3"
          >
            <p className="text-xs font-semibold text-primary mb-2">
              This will be visible to:
            </p>
            {selectedFriends.length > 0 && (
              <div className="mb-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Friends</p>
                <div className="flex flex-wrap gap-1">
                  {selectedFriends.map(f => (
                    <span key={f.id} className="inline-flex items-center gap-1 text-xs bg-background px-2 py-0.5 rounded-full border border-border/50">
                      {f.full_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedGroups.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Circles</p>
                <div className="flex flex-wrap gap-1">
                  {selectedGroups.map(g => (
                    <span key={g.id} className="inline-flex items-center gap-1 text-xs bg-background px-2 py-0.5 rounded-full border border-border/50">
                      {g.name}
                      <span className="text-[10px] text-muted-foreground">({g.member_ids?.length || 0})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!hasSharing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 italic">
          <span>Only visible to you</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant={showFriends ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setShowFriends(!showFriends); setShowGroups(false); }}
          className="rounded-xl h-9 text-xs"
        >
          <UserPlus className="w-3 h-3 mr-1" />
          Friends {shareWithIds?.length > 0 && `(${shareWithIds.length})`}
        </Button>
        {groups.length > 0 && (
          <Button
            type="button"
            variant={showGroups ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setShowGroups(!showGroups); setShowFriends(false); }}
            className="rounded-xl h-9 text-xs"
          >
            <Users className="w-3 h-3 mr-1" />
            Circles {shareGroupIds?.length > 0 && `(${shareGroupIds.length})`}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showFriends && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
              {friends.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No friends yet. Add friends from the Friends tab to share memories with them.
                </p>
              ) : (
                friends.map(f => {
                  const isSelected = includesFriendId(shareWithIds, f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFriend(f.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      <div className="w-7 h-7 rounded-full bg-secondary overflow-hidden shrink-0">
                        <SafeImage
                          src={f.photo_url}
                          alt={f.full_name}
                          className="w-full h-full object-cover"
                          fallback={<span className="text-[10px] font-bold flex items-center justify-center h-full">{f.full_name?.charAt(0)}</span>}
                        />
                      </div>
                      <span className="truncate">{f.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">@{f.username}</span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGroups && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
              {groups.map(g => {
                const isSelected = (shareGroupIds || []).includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <span>{g.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {g.member_ids?.length || 0} members
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasSharing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 pt-1"
        >
          <ToggleShare type="text" label="Share text" value={shareText} onChange={onChange} />
          <ToggleShare type="photo" label="Share photos" value={sharePhoto} onChange={onChange} />
          <ToggleShare type="voice" label="Share voice" value={shareVoice} onChange={onChange} />
          <ToggleShare type="video" label="Share video" value={shareVideo} onChange={onChange} />
        </motion.div>
      )}
    </div>
  );
}

function ToggleShare({ type, label, value, onChange }) {
  const toggleKey = `share_${type}`;
  return (
    <button
      type="button"
      onClick={() => onChange({ [toggleKey]: !value })}
      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
        value
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-secondary border-border/50 text-muted-foreground'
      }`}
    >
      {label}
    </button>
  );
}
