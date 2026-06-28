import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Send } from 'lucide-react';
import SafeImage from '@/components/shared/SafeImage';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const REACTIONS = ['❤️', '😢', '😂', '😮', '😡', '👍'];

export default function MemoryInteractions({ memoryId, compact }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showReactions, setShowReactions] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['memoryInteractions', memoryId],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getMemoryInteractions', { memoryId });
      return data?.interactions || [];
    },
    enabled: !!memoryId,
  });

  const likes = interactions.filter(i => i.type === 'like');
  const comments = interactions.filter(i => i.type === 'comment');
  const isLiked = likes.some(l => l.created_by_id === user?.id);

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        const myLike = likes.find(l => l.created_by_id === user?.id);
        if (myLike) await base44.entities.MemoryInteraction.delete(myLike.id);
      } else {
        await base44.functions.invoke('createMemoryInteraction', {
          memoryId,
          type: 'like',
        });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['memoryInteractions', memoryId] });
      const previous = queryClient.getQueryData(['memoryInteractions', memoryId]);
      queryClient.setQueryData(['memoryInteractions', memoryId], (old = []) => {
        if (isLiked) {
          return old.filter(i => !(i.type === 'like' && i.created_by_id === user?.id));
        }
        return [...old, {
          id: 'opt-' + Date.now(), memory_id: memoryId, type: 'like',
          user_name: user?.full_name || 'Someone', user_photo: user?.photo_url || '',
          created_by_id: user?.id, created_date: new Date().toISOString()
        }];
      });
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['memoryInteractions', memoryId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['memoryInteractions', memoryId] });
    },
  });

  const addComment = useMutation({
    mutationFn: (text) => base44.functions.invoke('createMemoryInteraction', {
      memoryId,
      type: 'comment',
      content: text,
    }),
    onMutate: async (text) => {
      setCommentText('');
      await queryClient.cancelQueries({ queryKey: ['memoryInteractions', memoryId] });
      const previous = queryClient.getQueryData(['memoryInteractions', memoryId]);
      queryClient.setQueryData(['memoryInteractions', memoryId], (old = []) => [...old, {
        id: 'opt-' + Date.now(), memory_id: memoryId, type: 'comment',
        content: text, user_name: user?.full_name || 'Someone',
        user_photo: user?.photo_url || '', created_by_id: user?.id,
        created_date: new Date().toISOString()
      }]);
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['memoryInteractions', memoryId], context.previous);
      toast.error('Failed to add comment');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['memoryInteractions', memoryId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId) => base44.entities.MemoryInteraction.delete(commentId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['memoryInteractions', memoryId] }),
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate(commentText.trim());
  };

  return (
    <div className={cn("mt-3", !compact && "pt-3 border-t border-border/30")}>
      {/* Actions bar */}
      <div className="flex items-center gap-1">
        {/* Like button with hover reactions */}
        <div className="relative"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            onClick={() => toggleLike.mutate()}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              isLiked
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Heart className={cn("w-4 h-4 transition-transform", isLiked && "fill-current scale-110")} />
            Like
          </button>

          {/* Reaction picker */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                className="absolute -top-12 left-0 bg-card rounded-full shadow-lg border border-border px-2 py-1.5 flex gap-0.5 z-20"
              >
                {REACTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      if (!isLiked) toggleLike.mutate();
                      setShowReactions(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:scale-125 transition-transform text-lg"
                  >
                    {r}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
      </div>

      {/* Like count + profile circles (who liked) */}
      {likes.length > 0 && (
        <div className="mt-2">
          <div className="flex -space-x-1.5">
            {likes.map((like, i) => (
              <div
                key={like.id}
                className="w-6 h-6 rounded-full border-[1.5px] border-card bg-secondary overflow-hidden"
                style={{ zIndex: likes.length - i }}
                title={like.user_name}
              >
                <SafeImage src={like.user_photo} alt={like.user_name} className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center bg-primary/10 text-[9px] font-bold text-primary">{like.user_name?.charAt(0)?.toUpperCase() || '?'}</div>} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2.5">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2 group/comment">
                  <div className="w-7 h-7 rounded-full bg-secondary flex-shrink-0 overflow-hidden mt-0.5">
                    <SafeImage src={comment.user_photo} alt="" className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted-foreground">{comment.user_name?.charAt(0)?.toUpperCase() || '?'}</div>} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-secondary rounded-2xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold">{comment.user_name}</span>
                        <span className="text-[9px] text-muted-foreground">
                          {format(new Date(comment.created_date), 'MMM d \'at\' h:mm a')}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed break-words">{comment.content}</p>
                    </div>
                    {comment.created_by_id === user?.id && (
                      <button
                        onClick={() => deleteComment.mutate(comment.id)}
                        className="ml-1 mt-0.5 text-[9px] text-muted-foreground hover:text-destructive opacity-0 group-hover/comment:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No comments yet. Say something nice!
                </p>
              )}

              {/* Add comment input */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-full bg-secondary flex-shrink-0 overflow-hidden">
                  <SafeImage src={user?.photo_url} alt="" className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted-foreground">{user?.full_name?.charAt(0)?.toUpperCase() || '?'}</div>} />
                </div>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="rounded-full h-9 text-xs pr-10 bg-secondary border-0 focus-visible:ring-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!commentText.trim() || addComment.isPending}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-7 w-7"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}