import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, X, User } from 'lucide-react';
import SafeImage from '@/components/shared/SafeImage';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function RequestRow({ name, username, photoUrl, children }) {
  return (
    <KeepsakeCard padding={false} className="flex items-center gap-3 p-3">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
        {photoUrl ? (
          <SafeImage src={photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-primary">
            {name?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium truncate">{name}</p>
        <p className="text-caption">@{username}</p>
      </div>
      {children}
    </KeepsakeCard>
  );
}

export default function FriendRequests() {
  const queryClient = useQueryClient();

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: () => base44.functions.invoke('getMyPendingRequests'),
  });

  const incoming = requestsData?.data?.incoming || [];
  const outgoing = requestsData?.data?.outgoing || [];

  const respondMutation = useMutation({
    mutationFn: ({ friendshipId, action }) =>
      base44.functions.invoke('respondToFriendRequest', { friendshipId, action }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myFriends'] });
      toast.success(vars.action === 'accepted' ? 'Friend request accepted' : 'Request declined');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: (friendshipId) => base44.entities.Friendship.delete(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      toast.success('Request cancelled');
    },
    onError: () => toast.error('Failed to cancel request'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <EmptyState
        prompt="No requests waiting"
        subtitle="Search for friends to connect with."
        illustration={<User className="w-8 h-8 text-primary/50" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      {incoming.length > 0 && (
        <div>
          <p className="text-overline mb-2 px-1">Incoming</p>
          <div className="space-y-2">
            {incoming.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <RequestRow name={f.from_user_name} username={f.from_username}>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => respondMutation.mutate({ friendshipId: f.id, action: 'accepted' })}
                      disabled={respondMutation.isPending}
                      className="rounded-xl h-8 w-8 p-0"
                      aria-label="Accept"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => respondMutation.mutate({ friendshipId: f.id, action: 'rejected' })}
                      disabled={respondMutation.isPending}
                      className="rounded-xl h-8 w-8 p-0 text-muted-foreground"
                      aria-label="Decline"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </RequestRow>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <p className="text-overline mb-2 px-1">Sent</p>
          <div className="space-y-2">
            {outgoing.map((f) => (
              <RequestRow key={f.id} name={f.to_user_name} username={f.to_username}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => cancelMutation.mutate(f.id)}
                  disabled={cancelMutation.isPending}
                  className="rounded-xl h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  aria-label="Cancel request"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </RequestRow>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
