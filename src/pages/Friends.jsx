import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import FriendSearch from '@/components/friends/FriendSearch';
import FriendRequests from '@/components/friends/FriendRequests';
import MyFriends from '@/components/friends/MyFriends';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { User, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function Friends() {
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    await queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
    await queryClient.invalidateQueries({ queryKey: ['myFriends'] });
  }, [queryClient]);

  const { indicatorRef } = usePullToRefresh(handleRefresh);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingData } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: () => base44.functions.invoke('getMyPendingRequests'),
    refetchInterval: 30000,
  });
  const pendingCount = (pendingData?.data?.incoming?.length || 0) + (pendingData?.data?.outgoing?.length || 0);

  const hasUsername = !!user?.username;

  const setUsernameMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({ username: newUsername }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowUsernameSetup(false);
      toast.success('Username set!');
    },
    onError: (err) => {
      toast.error('Failed to set username. It might be taken.');
    },
  });

  return (
    <div className="min-h-screen relative">
      <div ref={indicatorRef} className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10 opacity-0 transition-all">
        <div className="mt-2 w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin bg-card shadow" />
      </div>
      <PageHeader
        title="Friends"
        subtitle="Connect with family and friends"
        showBack
        action={
          !hasUsername && (
            <Button size="sm" onClick={() => setShowUsernameSetup(true)} className="rounded-xl gap-1.5">
              <User className="w-3.5 h-3.5" /> Set Username
            </Button>
          )
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections"
      >
        {!hasUsername && (
          <KeepsakeCard className="bg-primary/5 border-primary/15">
            <p className="text-body">
              Set a username so friends can find you. You&apos;ll only appear in searches after setting one.
            </p>
          </KeepsakeCard>
        )}

        <Tabs defaultValue="friends">
          <TabsList className="w-full bg-secondary/50 rounded-xl h-10 mb-1">
            <TabsTrigger value="friends" className="rounded-lg text-caption flex-1">My Friends</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg text-caption flex-1 relative">
              Requests
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] rounded-full bg-destructive flex items-center justify-center text-[10px] font-bold text-destructive-foreground px-1">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" className="rounded-lg text-caption flex-1">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4">
            <MyFriends />
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <FriendRequests />
          </TabsContent>

          <TabsContent value="search" className="mt-4">
            <FriendSearch />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Username setup dialog */}
      <Dialog open={showUsernameSetup} onOpenChange={setShowUsernameSetup}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-section-title">Choose a username</DialogTitle>
            <p className="text-caption mt-1">
              This is how friends will find you. Pick something unique and memorable.
            </p>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="e.g. johnsmith"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
              className="rounded-xl h-12"
              maxLength={30}
            />
            <p className="text-caption mt-1.5">
              Letters, numbers, and underscores only
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setUsernameMutation.mutate()}
              disabled={!newUsername || newUsername.length < 3 || setUsernameMutation.isPending}
              className="rounded-xl gap-2 w-full"
            >
              <Check className="w-4 h-4" />
              {setUsernameMutation.isPending ? 'Setting…' : 'Set username'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}