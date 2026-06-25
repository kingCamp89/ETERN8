import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText, Image, Mic, Video, Calendar, Trash2, Pencil, MoreHorizontal, Clock, Heart } from 'lucide-react';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import EmotionBadge from '@/components/shared/EmotionBadge';
import MemoryInteractions from '@/components/shared/MemoryInteractions';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import { MemoryMediaPreview } from '@/components/memory/MemoryMedia';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const typeIcons = {
  text: FileText,
  photo: Image,
  voice: Mic,
  video: Video,
};

export default function MemoryCard({ memory, index = 0 }) {
  const TypeIcon = typeIcons[memory.memory_type] || FileText;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const memoryDate = memory.memory_date || memory.created_date;
  const lovedOneName = memory.loved_one_name?.trim() || null;
  const avatarName = lovedOneName || memory.title || 'Memory';
  const avatarSrc = lovedOneName ? memory.loved_one_photo_url : null;

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Memory.delete(memory.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['groupMemories'] });
    },
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
        whileTap={{ scale: 0.98 }}
      >
        <KeepsakeCard interactive padding={false} className="overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 p-4 pb-0">
            <ProfileAvatar
              src={avatarSrc}
              name={avatarName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-menu-title truncate">
                {lovedOneName || 'Personal memory'}
              </p>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-caption">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {memoryDate ? format(new Date(memoryDate), 'MMM d, yyyy') : '—'}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 capitalize">
                  <TypeIcon className="w-2.5 h-2.5" />
                  {memory.memory_type}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full hover:bg-secondary/80 flex items-center justify-center transition-colors"
                  aria-label="Memory options"
                >
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl w-36">
                <DropdownMenuItem onClick={() => navigate(`/create?edit=${memory.id}`)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDelete(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Badges row */}
          {(memory.emotion || memory.is_scheduled || memory.is_legacy) && (
            <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5">
              {memory.emotion && <EmotionBadge emotion={memory.emotion} />}
              {memory.is_scheduled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Clock className="w-2.5 h-2.5" />
                  Scheduled
                </span>
              )}
              {memory.is_legacy && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Heart className="w-2.5 h-2.5" />
                  Legacy
                </span>
              )}
            </div>
          )}

          <Link to={`/memory/${memory.id}`} className="block">
            {memory.memory_type === 'photo' && memory.media_url ? (
              <div className="mx-4 mt-3">
                <MemoryMediaPreview memory={memory} />
              </div>
            ) : memory.memory_type !== 'text' || memory.media_url ? (
              <MemoryMediaPreview memory={memory} />
            ) : null}

            <div className="p-4 pt-3 space-y-1.5">
              <h3 className="text-card-title">{memory.title}</h3>
              {memory.content && (
                <p className="text-body text-muted-foreground line-clamp-3">
                  {memory.content}
                </p>
              )}
            </div>
          </Link>

          <div className="border-t border-border/30 px-4 py-2.5">
            <MemoryInteractions memoryId={memory.id} compact />
          </div>
        </KeepsakeCard>
      </motion.div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete this memory?</AlertDialogTitle>
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
    </>
  );
}
