import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import useLovedOnes from '../../hooks/useLovedOnes';

export default function ShareOptions({
  shareWithIds,
  shareGroupIds,
  shareText,
  sharePhoto,
  shareVoice,
  shareVideo,
  onChange,
}) {
  const [showPeople, setShowPeople] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => base44.entities.TrustedContact.list(),
  });

  const { data: lovedOnes = [] } = useLovedOnes();

  // Combine loved ones and trusted contacts into a single people list
  const people = [
    ...lovedOnes.map(lo => ({ id: lo.id, name: lo.name, relationship: lo.relationship, type: 'loved_one' })),
    ...connections.map(tc => ({ id: tc.id, name: tc.name, relationship: tc.relationship, type: 'contact' })),
  ];

  const { data: groups = [] } = useQuery({
    queryKey: ['memoryGroups'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getMyGroups', {});
      return data?.groups || [];
    },
  });

  const togglePerson = (userId) => {
    const current = shareWithIds || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
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

  const selectedPeople = people.filter(p => (shareWithIds || []).includes(p.id));
  const selectedGroups = groups.filter(g => (shareGroupIds || []).includes(g.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Share this with</span>
      </div>

      {/* Visibility summary — only show when sharing is active */}
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
            {selectedPeople.length > 0 && (
              <div className="mb-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">People</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPeople.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1 text-xs bg-background px-2 py-0.5 rounded-full border border-border/50">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedGroups.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Groups</p>
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

      {/* Show "only visible to you" when nothing is shared */}
      {!hasSharing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 italic">
          <span>Only visible to you</span>
        </div>
      )}

      {/* Sharing buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant={showPeople ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setShowPeople(!showPeople); setShowGroups(false); }}
          className="rounded-xl h-9 text-xs"
        >
          <UserPlus className="w-3 h-3 mr-1" />
          People {shareWithIds?.length > 0 && `(${shareWithIds.length})`}
        </Button>
        {groups.length > 0 && (
          <Button
            type="button"
            variant={showGroups ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setShowGroups(!showGroups); setShowPeople(false); }}
            className="rounded-xl h-9 text-xs"
          >
            <Users className="w-3 h-3 mr-1" />
            Groups {shareGroupIds?.length > 0 && `(${shareGroupIds.length})`}
          </Button>
        )}
      </div>

      {/* People picker */}
      <AnimatePresence>
        {showPeople && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/40 rounded-xl p-3 space-y-1">
              {people.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No people to share with yet. Add loved ones or trusted contacts first.
                </p>
              ) : (
                people.map(p => {
                  const isSelected = (shareWithIds || []).includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePerson(p.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      <span>{p.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{p.relationship}</span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group picker */}
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

      {/* Per-type sharing toggles */}
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