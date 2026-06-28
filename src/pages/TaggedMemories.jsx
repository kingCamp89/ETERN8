import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import EmptyState from '../components/shared/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Check, X, Tag, Bookmark, ChevronRight, FileText, Image, Mic, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const typeIcon = { text: FileText, photo: Image, voice: Mic, video: Video };

function SenderAvatar({ name }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-primary">{initials}</span>
    </div>
  );
}

const emotions = [
  'love', 'pride', 'joy', 'gratitude', 'nostalgia', 'hope',
];

export default function TaggedMemories() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showRespond, setShowRespond] = useState(null);
  const [thoughts, setThoughts] = useState('');
  const [thoughtEmotion, setThoughtEmotion] = useState('');

  const { data: shares = [] } = useQuery({
    queryKey: ['memoryShares'],
    queryFn: () => base44.entities.MemoryShare.list('-shared_at'),
  });

  const pendingShares = shares.filter(s => s.status === 'pending');
  const acceptedShares = shares.filter(s => s.status === 'accepted');
  const taggedShares = shares.filter(s => s.status === 'tagged');

  const updateShare = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MemoryShare.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memoryShares'] });
      setShowRespond(null);
      setThoughts('');
      setThoughtEmotion('');
    },
  });

  const handleAccept = (share) => setShowRespond(share);
  const handleReject = (share) => updateShare.mutate({ id: share.id, data: { status: 'rejected' } });
  const handleTag = (share) => updateShare.mutate({ id: share.id, data: { status: 'tagged' } });

  const handleSubmitResponse = () => {
    if (!showRespond) return;
    updateShare.mutate({
      id: showRespond.id,
      data: {
        status: 'accepted',
        added_thoughts: thoughts,
        added_emotion: thoughtEmotion,
      },
    });
  };

  const emptyCopy = {
    pending: { prompt: 'Nothing waiting', subtitle: 'When someone shares a memory with you, it will appear here.' },
    accepted: { prompt: 'Your shared timeline', subtitle: 'Accepted memories and your responses will show here.' },
    tagged: { prompt: 'Saved for later', subtitle: 'Memories you tagged without adding to your timeline.' },
  };

  const ShareCard = ({ share }) => {
    const TypeIcon = typeIcon[share.memory_type] || FileText;
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <KeepsakeCard padding={false} className="overflow-hidden">
          {/* Header */}
          <div className="flex items-start gap-3 p-4 pb-3">
            <SenderAvatar name={share.from_user_name} />
            <div className="flex-1 min-w-0">
              <p className="text-body font-semibold truncate">
                {share.from_user_name || 'Someone'}
              </p>
              <p className="text-caption">
                shared a memory{share.shared_at ? ` · ${format(new Date(share.shared_at), 'MMM d')}` : ''}
              </p>
            </div>
            <div className="shrink-0 w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center">
              <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Memory title */}
          <button
            type="button"
            onClick={() => share.memory_id && navigate(`/memory/${share.memory_id}`)}
            className="w-full text-left px-4 pb-3 group"
          >
            <p className="text-section-title group-hover:text-primary transition-colors line-clamp-2">
              {share.memory_title || 'Untitled memory'}
            </p>
          </button>

          {/* Actions */}
          <div className="px-4 pb-4 space-y-2">
            {share.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAccept(share)} className="rounded-xl gap-1 flex-1">
                  <Check className="w-3.5 h-3.5" /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleTag(share)} className="rounded-xl gap-1">
                  <Bookmark className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => share.memory_id && navigate(`/memory/${share.memory_id}`)}
                  className="rounded-xl gap-1"
                >
                  View <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleReject(share)} className="rounded-xl text-destructive px-2.5">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {(share.status === 'accepted' || share.status === 'tagged') && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => share.memory_id && navigate(`/memory/${share.memory_id}`)}
                className="rounded-xl gap-1.5 w-full"
              >
                View memory <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}

            {share.status === 'accepted' && share.added_thoughts && (
              <div className="p-3 bg-secondary/50 rounded-xl">
                <p className="text-caption italic mb-1">Your response</p>
                <p className="text-body">&ldquo;{share.added_thoughts}&rdquo;</p>
                {share.added_emotion && (
                  <span className="text-caption text-primary mt-1 inline-block capitalize">· {share.added_emotion}</span>
                )}
              </div>
            )}

            {share.status === 'tagged' && (
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span className="text-caption">Saved to tagged</span>
              </div>
            )}
          </div>
        </KeepsakeCard>
      </motion.div>
    );
  };

  const tabLists = { pending: pendingShares, accepted: acceptedShares, tagged: taggedShares };

  return (
    <div className="min-h-screen">
      <PageHeader title="Shared with you" subtitle="Memories others have shared" showBack />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <Tabs defaultValue="pending">
          <TabsList className="w-full bg-secondary/50 rounded-xl h-10 mb-1">
            <TabsTrigger value="pending" className="rounded-lg text-caption flex-1">
              Pending ({pendingShares.length})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="rounded-lg text-caption flex-1">
              Timeline ({acceptedShares.length})
            </TabsTrigger>
            <TabsTrigger value="tagged" className="rounded-lg text-caption flex-1">
              Tagged ({taggedShares.length})
            </TabsTrigger>
          </TabsList>

          {['pending', 'accepted', 'tagged'].map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {tabLists[tab].length > 0 ? (
                tabLists[tab].map(share => <ShareCard key={share.id} share={share} />)
              ) : (
                <EmptyState
                  prompt={emptyCopy[tab].prompt}
                  subtitle={emptyCopy[tab].subtitle}
                  illustration={<Heart className="w-8 h-8 text-primary/50" />}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      <Dialog open={!!showRespond} onOpenChange={() => setShowRespond(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-section-title">Add your thoughts</DialogTitle>
            {showRespond?.memory_title && (
              <p className="text-caption mt-0.5 truncate">&ldquo;{showRespond.memory_title}&rdquo;</p>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="What does this moment mean to you? (optional)"
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              className="rounded-xl min-h-[100px] resize-none text-body"
            />
            <div className="flex flex-wrap gap-2">
              {emotions.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setThoughtEmotion(thoughtEmotion === em ? '' : em)}
                  className={`text-caption px-2.5 py-1 rounded-full border capitalize transition-colors ${
                    thoughtEmotion === em
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 text-muted-foreground hover:bg-secondary/40'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitResponse} className="flex-1 rounded-xl gap-2">
                <Check className="w-4 h-4" /> Accept
              </Button>
              {showRespond?.memory_id && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRespond(null);
                    navigate(`/memory/${showRespond.memory_id}`);
                  }}
                  className="rounded-xl gap-1.5"
                >
                  View <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
