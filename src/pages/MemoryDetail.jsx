import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '../components/shared/PageHeader';
import EmotionBadge from '../components/shared/EmotionBadge';
import MemoryInteractions from '../components/shared/MemoryInteractions';
import ProfileAvatar from '../components/shared/ProfileAvatar';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import EmptyState from '../components/shared/EmptyState';
import MemoryDetailSkeleton from '../components/memory/MemoryDetailSkeleton';
import { MemoryMediaPreview, MemoryMetaChips } from '../components/memory/MemoryMedia';
import { format } from 'date-fns';
import { Tag, Clock, Heart, MapPin, Pencil, Trash2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const sectionMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0, 0, 0.2, 1] },
};

export default function MemoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Memory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      navigate(-1);
    },
  });

  const { data: memory, isLoading } = useQuery({
    queryKey: ['memory', id],
    queryFn: async () => {
      const list = await base44.entities.Memory.filter({ id });
      if (list[0]) return list[0];

      const { data } = await base44.functions.invoke('getMemory', { memoryId: id });
      if (data?.memory) {
        base44.functions.invoke('logContentAccess', {
          event_type: 'content_viewed',
          content_type: 'memory',
          content_id: id,
          details: `Viewed shared memory: ${data.memory.title}`,
        });
      }
      return data?.memory || null;
    },
    enabled: !!id,
  });

  // Pending share for this memory addressed to the current user
  const { data: pendingShare } = useQuery({
    queryKey: ['pendingShare', id, currentUser?.id],
    queryFn: () => base44.entities.MemoryShare.filter({ memory_id: id, status: 'pending' }),
    select: (shares) => shares?.[0] ?? null,
    enabled: !!id && !!currentUser?.id && !isLoading,
  });

  const acceptShareMutation = useMutation({
    mutationFn: (shareId) => base44.entities.MemoryShare.update(shareId, { status: 'accepted' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingShare', id] });
      queryClient.invalidateQueries({ queryKey: ['memoryShares'] });
      queryClient.invalidateQueries({ queryKey: ['pendingShares'] });
      toast.success('Memory added to your timeline');
    },
  });

  const rejectShareMutation = useMutation({
    mutationFn: (shareId) => base44.entities.MemoryShare.update(shareId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingShare', id] });
      queryClient.invalidateQueries({ queryKey: ['memoryShares'] });
      queryClient.invalidateQueries({ queryKey: ['pendingShares'] });
      navigate(-1);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader title="" showBack />
        <MemoryDetailSkeleton />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="min-h-screen">
        <PageHeader title="" showBack />
        <EmptyState
          prompt="This memory couldn't be found — it may have been removed or you don't have access."
          subtitle="Head back and explore your other keepsakes."
          action={
            <Button onClick={() => navigate(-1)} className="rounded-xl">
              Go back
            </Button>
          }
        />
      </div>
    );
  }

  const memoryDate = memory.memory_date || memory.created_date;
  const creatorName = memory.created_by_name || 'Someone special';
  const isOwner = memory.created_by_id === currentUser?.id;
  const lovedOneName = memory.loved_one_name?.trim() || null;
  const headerName = lovedOneName || 'Personal memory';
  const headerPhoto = lovedOneName ? memory.loved_one_photo_url : memory.created_by_photo_url;
  const headerAvatarName = lovedOneName || creatorName;

  return (
    <div className="min-h-screen">
      <PageHeader
        title=""
        showBack
        action={
          isOwner ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/create?edit=${id}`)}
                className="rounded-xl h-11 w-11"
                aria-label="Edit memory"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-xl h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label="Delete memory"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : null
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
        className="page-sections pb-8"
      >
        {/* Pending share banner — shown to recipient before they accept */}
        {pendingShare && !isOwner && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <KeepsakeCard className="border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-primary">
                    {pendingShare.from_user_name || 'Someone'} shared this with you
                  </p>
                  <p className="text-caption mt-0.5">
                    Accept to add it to your Shared With You timeline
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => acceptShareMutation.mutate(pendingShare.id)}
                  disabled={acceptShareMutation.isPending}
                  className="rounded-xl gap-1.5 flex-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  {acceptShareMutation.isPending ? 'Accepting…' : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => rejectShareMutation.mutate(pendingShare.id)}
                  disabled={rejectShareMutation.isPending}
                  className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 px-3"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </KeepsakeCard>
          </motion.div>
        )}

        {/* Hero media */}
        {(memory.memory_type === 'photo' || memory.memory_type === 'video') && memory.media_url && (
          <motion.div {...sectionMotion}>
            <MemoryMediaPreview memory={memory} large />
          </motion.div>
        )}

        <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: 0.06 }}>
          <KeepsakeCard padding={false} className="overflow-hidden">
            <div className="p-5 space-y-4">
              {/* Creator */}
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  src={headerPhoto}
                  name={headerAvatarName}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-menu-title">{headerName}</p>
                  <p className="text-caption">
                    {memoryDate ? format(new Date(memoryDate), 'EEEE, MMMM d, yyyy') : 'A cherished moment'}
                    {lovedOneName && ` · ${isOwner ? 'you' : creatorName}`}
                  </p>
                </div>
              </div>

              {/* Voice / text preview inside card */}
              {memory.memory_type === 'voice' && (
                <MemoryMediaPreview memory={memory} large />
              )}
              {memory.memory_type === 'text' && !memory.media_url && (
                <MemoryMediaPreview memory={memory} large />
              )}

              <div className="space-y-3">
                <h1 className="text-page-title">
                  {memory.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  {memory.emotion && <EmotionBadge emotion={memory.emotion} size="md" />}
                  <MemoryMetaChips memory={memory} memoryDate={memoryDate} showDate={false} />
                </div>
              </div>

              {memory.loved_one_name && (
                <Link
                  to={memory.loved_one_id ? `/profile/${memory.loved_one_id}` : '#'}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-3.5 py-2 text-body font-medium text-primary hover:bg-primary/8 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  For {memory.loved_one_name}
                </Link>
              )}

              {memory.location_name && (
                <p className="flex items-center gap-1.5 text-body text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {memory.location_name}
                </p>
              )}

              {memory.content && (
                <div className="rounded-2xl glass-warm border border-border/30 px-5 py-4">
                  <p className="text-quote-lg whitespace-pre-wrap">
                    &ldquo;{memory.content}&rdquo;
                  </p>
                </div>
              )}

              {memory.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {memory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1.5 text-caption text-muted-foreground"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border/30 px-5 py-4">
              <MemoryInteractions memoryId={memory.id} />
            </div>
          </KeepsakeCard>
        </motion.div>

        {memory.is_scheduled && memory.scheduled_date && (
          <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: 0.12 }}>
            <KeepsakeCard className="bg-primary/[0.03] border-primary/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-body font-semibold text-primary mb-1">Scheduled delivery</p>
                  {memory.delivery_status === 'delivered' ? (
                    <p className="text-body text-muted-foreground leading-relaxed">
                      Sent to {memory.loved_one_name || 'recipient'} on{' '}
                      {memory.delivered_date
                        ? format(new Date(memory.delivered_date), 'MMMM d, yyyy')
                        : format(new Date(memory.scheduled_date), 'MMMM d, yyyy')}
                      {memory.scheduled_occasion && ` — ${memory.scheduled_occasion}`}
                    </p>
                  ) : memory.delivery_status === 'cancelled' ? (
                    <p className="text-body text-muted-foreground leading-relaxed">
                      Delivery was cancelled.
                      {memory.last_delivery_error && ` ${memory.last_delivery_error}`}
                    </p>
                  ) : (
                    <p className="text-body text-muted-foreground leading-relaxed">
                      This memory will be revealed on{' '}
                      {format(new Date(memory.scheduled_date), 'MMMM d, yyyy')}
                      {memory.scheduled_time && ` at ${memory.scheduled_time}`}
                      {memory.scheduled_occasion && ` — ${memory.scheduled_occasion}`}
                    </p>
                  )}
                </div>
              </div>
            </KeepsakeCard>
          </motion.div>
        )}

        {(memory.is_legacy || memory.delivery_type === 'legacy') && (
          <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: 0.16 }}>
            <KeepsakeCard className="bg-primary/[0.03] border-primary/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-body font-semibold text-primary mb-1">Legacy memory</p>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Preserved for legacy delivery — a gift meant to outlast the moment it was written.
                  </p>
                </div>
              </div>
            </KeepsakeCard>
          </motion.div>
        )}
      </motion.div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-section-title">Delete this memory?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. &ldquo;{memory.title}&rdquo; will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
