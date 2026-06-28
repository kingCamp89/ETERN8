import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PageHeader from '@/components/shared/PageHeader';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ChevronRight, Share2, Users, Trash2, Camera } from 'lucide-react';
import QueryErrorState from '@/components/shared/QueryErrorState';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import MyFriends from '@/components/friends/MyFriends';
import UsernameSearch from '@/components/friends/UsernameSearch';
import SafeImage from '@/components/shared/SafeImage';

const coverGradients = {
  rose: 'from-primary/25 via-primary/10 to-transparent',
  gold: 'from-primary/30 via-secondary/20 to-transparent',
  sky: 'from-primary/20 via-accent/15 to-transparent',
  sage: 'from-primary/15 via-secondary/30 to-transparent',
  lavender: 'from-primary/20 via-muted/40 to-transparent',
  coral: 'from-primary/25 via-accent/20 to-transparent',
};

const coverColors = ['rose', 'gold', 'sky', 'sage', 'lavender', 'coral'];

export default function Groups() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const createPrefilled = useRef(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', cover_color: 'rose' });
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['myGroups'] });
  }, [queryClient]);

  const { indicatorRef } = usePullToRefresh(handleRefresh);

  const { data: groups = [], isLoading: groupsLoading, isError: groupsIsError, refetch: refetchGroups } = useQuery({
    queryKey: ['myGroups'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getMyGroups', {});
      return data?.groups || [];
    },
    retry: 2,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.MemoryGroup.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      setShowCreate(false);
      resetForm();
      toast.success('Circle created');
    },
    onError: () => {
      toast.error('Failed to create circle');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MemoryGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      toast.success('Circle deleted');
    },
  });

  const resetForm = () => {
    setForm({ name: '', description: '', cover_color: 'rose' });
    setSelectedFriends([]);
    setShowFriendPicker(false);
    setGroupPhoto(null);
    setUploadingPhoto(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setGroupPhoto(file_url);
    setUploadingPhoto(false);
  };

  const toggleFriend = (friend) => {
    setSelectedFriends(prev => {
      const exists = prev.find(f => f.id === friend.id);
      if (exists) return prev.filter(f => f.id !== friend.id);
      return [...prev, friend];
    });
  };

  useEffect(() => {
    if (createPrefilled.current) return;
    const shouldCreate = searchParams.get('create') === '1';
    const friendId = searchParams.get('friend');
    if (!shouldCreate) return;

    createPrefilled.current = true;
    setShowCreate(true);

    if (friendId) {
      base44.functions.invoke('getMyFriends').then((res) => {
        const friend = res?.data?.friends?.find((f) => f.id === friendId);
        if (friend) setSelectedFriends([friend]);
      });
    }

    const next = new URLSearchParams(searchParams);
    next.delete('create');
    next.delete('friend');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen relative">
      {/* Pull-to-refresh indicator */}
      <div ref={indicatorRef} className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10 opacity-0 transition-all">
        <div className="mt-2 w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin bg-card shadow" />
      </div>
      <PageHeader
        title="Memory Circles"
        subtitle="Share moments with the people who matter"
        showBack
        action={
          <Dialog open={showCreate} onOpenChange={(open) => {
            setShowCreate(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5">
                <Plus className="w-4 h-4" /> New Circle
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-section-title">Create a Memory Circle</DialogTitle>
                <p className="text-caption mt-1">
                  Add friends to share memories together
                </p>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Circle name</Label>
                  <Input
                    placeholder="e.g. Family Memories"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What's this circle about?"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="rounded-xl resize-none text-body"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex gap-2">
                    {coverColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, cover_color: color }))}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${coverGradients[color].split(' ')[0]} border-2 transition-all ${
                          form.cover_color === color ? 'border-primary scale-110 shadow-md' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Circle photo</Label>
                  <label className="cursor-pointer flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-secondary border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden hover:border-primary/60 transition-colors">
                      {uploadingPhoto ? (
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : groupPhoto ? (
                        <SafeImage src={groupPhoto} alt="Circle photo" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-primary/50" />
                      )}
                    </div>
                    <span className="text-caption">
                      {groupPhoto ? 'Tap to change' : 'Add a cover photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Add friends</Label>
                  <p className="text-caption">
                    Friends will be added directly to the circle
                  </p>

                  {selectedFriends.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFriends.map((f) => (
                        <span key={f.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-caption px-2 py-1 rounded-full">
                          {f.full_name}
                          <button onClick={() => toggleFriend(f)}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowFriendPicker(!showFriendPicker)}
                    className="w-full rounded-xl gap-2"
                  >
                    <Users className="w-4 h-4" />
                    {selectedFriends.length > 0 ? `${selectedFriends.length} friend(s) selected` : 'Pick from friends'}
                  </Button>

                  {showFriendPicker && (
                    <div className="max-h-48 overflow-y-auto bg-secondary/30 rounded-xl p-2 mt-1">
                      <UsernameSearch
                        onSelect={toggleFriend}
                        selectedIds={selectedFriends.map(f => f.id)}
                      />
                      <div className="my-2 border-t border-border/30" />
                      <p className="text-caption font-medium mb-2 mt-2">Your friends</p>
                      <MyFriends onSelect={toggleFriend} selectedIds={selectedFriends.map(f => f.id)} compact />
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => {
                    const memberNames = [user?.full_name || 'You'];
                    const memberIds = [user?.id];
                    const memberPhotos = user?.photo_url ? [user.photo_url] : [];

                    selectedFriends.forEach(f => {
                      memberIds.push(f.id);
                      memberNames.push(f.full_name || f.username);
                      memberPhotos.push(f.photo_url || '');
                    });

                    createMutation.mutate({
                      name: form.name,
                      description: form.description,
                      cover_color: form.cover_color,
                      group_photo_url: groupPhoto || null,
                      member_ids: memberIds,
                      member_names: memberNames,
                      member_photos: memberPhotos,
                    });
                  }}
                  disabled={!form.name || !user || createMutation.isPending}
                  className="w-full rounded-xl gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {createMutation.isPending ? 'Creating…' : 'Create circle'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections"
      >
        {groupsLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="md" />
          </div>
        ) : groupsIsError ? (
          <QueryErrorState
            title="Couldn't load circles"
            onRetry={() => refetchGroups()}
          />
        ) : groups.length === 0 ? (
          <EmptyState
            prompt="Share moments with your circle"
            subtitle="Create a memory circle and add friends to share together."
            illustration={<Share2 className="w-8 h-8 text-primary/50" />}
            action={
              <Button onClick={() => setShowCreate(true)} className="rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Create your first circle
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {groups.map((group, i) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="relative group/card">
                    <Link to={`/groups/${group.id}`} className="block group">
                      <KeepsakeCard padding={false} interactive className="overflow-hidden">
                        <div className={`h-16 bg-gradient-to-br ${coverGradients[group.cover_color || 'rose']} relative`}>
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                        </div>

                        <div className="px-4 pb-4 -mt-6 relative">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-2xl border-2 border-card flex items-center justify-center overflow-hidden shadow-sm ${!group.group_photo_url ? 'bg-gradient-to-br ' + coverGradients[group.cover_color || 'rose'].split(' ')[0] : ''}`}>
                                <SafeImage src={group.group_photo_url} alt={group.name} className="w-full h-full object-cover" fallback={<span className="text-lg font-semibold text-primary-foreground font-heading">{(group.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>} />
                              </div>
                              <div className="pt-1">
                                <h3 className="text-section-title group-hover:text-primary transition-colors">
                                  {group.name}
                                </h3>
                                {group.description && (
                                  <p className="text-caption mt-0.5 line-clamp-1">{group.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5">
                                  <div className="flex -space-x-1.5">
                                    {(group.member_names || []).slice(0, 3).map((name, idx) => {
                                      const photo = group.member_photos?.[idx] || (group.member_ids?.[idx] === user?.id ? user?.photo_url : null);
                                      return (
                                        <div
                                          key={idx}
                                          className={`w-5 h-5 rounded-full border border-card flex items-center justify-center overflow-hidden ${
                                            !photo ? 'bg-primary/70' : ''
                                          }`}
                                          title={name}
                                        >
                                          <SafeImage src={photo} alt={name} className="w-full h-full object-cover" fallback={<span className="text-[8px] font-bold text-primary-foreground">{(name || '?')[0]}</span>} />
                                        </div>
                                      );
                                    })}
                                    {(group.member_names?.length || 0) > 3 && (
                                      <div className="w-5 h-5 rounded-full border border-card bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                                        +{(group.member_names?.length || 0) - 3}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-caption">
                                    {group.member_names?.length || group.member_ids?.length || 0} members
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground mt-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </KeepsakeCard>
                    </Link>
                    {group.created_by_id === user?.id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(group);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/80 backdrop-blur-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-60 md:opacity-0 md:group-hover/card:opacity-100 z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-section-title">Delete circle?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}