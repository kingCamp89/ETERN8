import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, X, MessageCircle, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SafeImage from '@/components/shared/SafeImage';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function MyFriends({ onSelect, selectedIds = [], compact = false }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [removeTarget, setRemoveTarget] = useState(null);
  const { data: friendsData, isLoading } = useQuery({
    queryKey: ['myFriends'],
    queryFn: () => base44.functions.invoke('getMyFriends'),
  });

  const friends = friendsData?.data?.friends || [];

  const removeMutation = useMutation({
    mutationFn: (friendId) => base44.functions.invoke('removeFriend', { friendId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFriends'] });
      toast.success('Friend removed');
      setRemoveTarget(null);
    },
    onError: () => {
      toast.error('Failed to remove friend');
      setRemoveTarget(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <EmptyState
        prompt="Your circle starts with one connection"
        subtitle="Use the Search tab to find family and friends by username."
        illustration={<User className="w-8 h-8 text-primary/50" />}
      />
    );
  }

  const rowClass = (isSelected) => {
    if (!onSelect) return '';
    return isSelected ? 'border-primary/25 bg-primary/5' : 'hover:bg-secondary/40';
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {friends.map((f) => {
        const isSelected = selectedIds.includes(f.id);
        return (
          <KeepsakeCard
            key={f.id}
            padding={false}
            interactive={!!onSelect}
            className={`flex items-center gap-3 p-3 ${rowClass(isSelected)}`}
            onClick={onSelect ? () => onSelect(f) : undefined}
            role={onSelect ? 'button' : undefined}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                <SafeImage
                  src={f.photo_url}
                  alt={f.full_name}
                  className="w-full h-full object-cover"
                  fallback={<span className="text-sm font-bold text-primary">{f.full_name?.charAt(0).toUpperCase()}</span>}
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-body font-medium truncate">{f.full_name}</p>
                <p className="text-caption">@{f.username}</p>
              </div>
            </div>
            {!onSelect && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const params = new URLSearchParams();
                    params.set('fromFriend', 'true');
                    params.set('name', f.full_name || '');
                    if (f.photo_url) params.set('photo_url', f.photo_url);
                    navigate(`/loved-ones/new?${params.toString()}`);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                  title="Add to My People"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <Link
                  to="/groups"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                  title="Circles"
                >
                  <MessageCircle className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setRemoveTarget(f); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </KeepsakeCard>
        );
      })}

      {/* Double-confirmation remove dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-section-title">
              Remove {removeTarget?.full_name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body text-muted-foreground">
              This will remove them from your friends list. You can always send a new friend request later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMutation.mutate(removeTarget.id)}
              disabled={removeMutation.isPending}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              {removeMutation.isPending ? 'Removing…' : 'Remove friend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}