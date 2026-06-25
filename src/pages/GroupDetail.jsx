import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MemoryInteractions from '@/components/shared/MemoryInteractions';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, UserPlus, Share2, MessageCircle, CalendarDays, ChevronRight, LogIn, Trash2, BookOpen, X, Camera } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from
'@/components/ui/dialog';
import MyFriends from '@/components/friends/MyFriends';
import UsernameSearch from '@/components/friends/UsernameSearch';
import SafeImage from '@/components/shared/SafeImage';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showInvite, setShowInvite] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [frameOffset, setFrameOffset] = useState({ x: 10, y: 33 });
  const [isDragging, setIsDragging] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: group, isLoading: groupLoading, isError: groupError } = useQuery({
    queryKey: ['groupDetail', id],
    queryFn: async () => {
      const response = await base44.functions.invoke('getGroupDetail', { groupId: id });
      return response.data?.group || null;
    },
    enabled: !!id
  });

  const { data: sharedMemories = [] } = useQuery({
    queryKey: ['groupMemories', id],
    queryFn: async () => {
      const me = await base44.auth.me();
      if (!me) return [];
      const response = await base44.functions.invoke('getGroupMemories', { groupId: id });
      return response.data?.memories || [];
    },
    enabled: !!group && (group.created_by_id === user?.id || group.member_ids?.includes(user?.id))
  });

  const addMembersMutation = useMutation({
    mutationFn: async () => {
      const memberIds = [];
      const memberNames = [];
      const memberPhotos = [];

      selectedFriends.forEach((f) => {
        if (!group.member_ids?.includes(f.id)) {
          memberIds.push(f.id);
          memberNames.push(f.full_name || f.username);
          memberPhotos.push(f.photo_url || '');
        }
      });

      return await base44.functions.invoke('addMembersToCircle', {
        groupId: group.id,
        memberIds,
        memberNames,
        memberPhotos,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDetail', id] });
      setShowInvite(false);
      setSelectedFriends([]);
      toast.success(`${selectedFriends.length} friend(s) added`);
    },
    onError: () => toast.error('Failed to add members')
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => base44.functions.invoke('removeFromCircle', { groupId: group.id, memberId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDetail', id] });
      toast.success('Member removed');
    }
  });

  const handleRemove = (memberId, name, isSelf) => {
    setRemoveConfirm({ memberId, name, isSelf });
  };

  const confirmRemove = () => {
    if (removeConfirm) {
      removeMutation.mutate(removeConfirm.memberId, {
        onSuccess: () => {
          setRemoveConfirm(null);
          if (removeConfirm.isSelf) {
            queryClient.invalidateQueries({ queryKey: ['myGroups'] });
            navigate('/groups', { replace: true });
          }
        },
      });
    }
  };

  const deleteCircleMutation = useMutation({
    mutationFn: () => base44.entities.MemoryGroup.delete(group.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      toast.success('Circle deleted');
      navigate('/groups', { replace: true });
    }
  });

  const handleDeleteCircle = () => {
    setDeleteConfirm(true);
  };

  const confirmDeleteCircle = () => {
    setDeleteConfirm(false);
    deleteCircleMutation.mutate();
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOWED_IMG = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!ALLOWED_IMG.includes(file.type)) { toast.error('Unsupported image type'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('Photo too large. Maximum: 20MB'); return; }
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.MemoryGroup.update(group.id, { group_photo_url: file_url });
    queryClient.invalidateQueries({ queryKey: ['groupDetail', id] });
    queryClient.invalidateQueries({ queryKey: ['myGroups'] });
    toast.success('Group photo updated');
    setUploadingPhoto(false);
    e.target.value = '';
  };

  const parsePosition = (posStr) => {
    if (!posStr || posStr === 'center') return { x: 10, y: 33 };
    const parts = posStr.split(' ');
    const x = parts[0] ? parseFloat(parts[0]) : 50;
    const y = parts[1] ? parseFloat(parts[1]) : 50;
    const fx = isNaN(x) ? 10 : Math.max(0, Math.min(20, x - 40));
    const fy = isNaN(y) ? 33 : Math.max(0, Math.min(65, y - 18));
    return { x: fx, y: fy };
  };

  const handleOpenPositionDialog = () => {
    const pos = parsePosition(group.group_photo_position);
    setFrameOffset(pos);
    setShowPositionDialog(true);
  };

  const handleFrameDrag = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width * 100;
    const cy = (e.clientY - rect.top) / rect.height * 100;
    setFrameOffset({
      x: Math.max(0, Math.min(20, Math.round(cx - 40))),
      y: Math.max(0, Math.min(65, Math.round(cy - 18)))
    });
  };

  const handleSavePosition = async () => {
    const objX = frameOffset.x + 40;
    const objY = frameOffset.y + 18;
    const posStr = `${objX}% ${objY}%`;
    await base44.entities.MemoryGroup.update(group.id, { group_photo_position: posStr });
    queryClient.invalidateQueries({ queryKey: ['groupDetail', id] });
    queryClient.invalidateQueries({ queryKey: ['myGroups'] });
    toast.success('Photo position saved');
    setShowPositionDialog(false);
  };

  const handleCenterFrame = () => {
    setFrameOffset({ x: 10, y: 33 });
  };

  const toggleFriend = (friend) => {
    setSelectedFriends((prev) => {
      const exists = prev.find((f) => f.id === friend.id);
      if (exists) return prev.filter((f) => f.id !== friend.id);
      return [...prev, friend];
    });
  };

  // Filter out existing members from friends list
  const existingMemberIds = new Set([...(group?.member_ids || []), group?.created_by_id]);

  if (groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Circle" showBack />
        <EmptyState
          prompt="Couldn't load this circle"
          subtitle="It may have been deleted or you don't have access."
          illustration={<Share2 className="w-8 h-8 text-destructive/50" />}
        />
      </div>
    );
  }

  const isMember = group.created_by_id === user?.id || group.member_ids?.includes(user?.id);

  return (
    <div className="min-h-screen">
      <PageHeader
        title={group.name}
        subtitle={group.description}
        showBack
        action={
        isMember ?
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowInvite(true)}
          className="rounded-xl gap-1.5">
          
              <UserPlus className="w-4 h-4" /> Add Friends
            </Button> :
        null
        } />
      

      {/* Non-member banner */}
      {!isMember && (
        <div className="page-sections mt-2">
          <KeepsakeCard className="flex items-center gap-3 border-primary/20 bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-body font-medium">You're not in this circle</p>
              <p className="text-caption">Ask a member to add you to see shared memories</p>
            </div>
          </KeepsakeCard>
        </div>
      )}

      {/* Hero photo */}
      <div className="mt-3">
        <div className="relative rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-primary/10 to-secondary/30">
          {/* Background photo */}
          {group.group_photo_url ?
          <img
            src={group.group_photo_url}
            alt={group.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: group.group_photo_position || 'center' }} /> :

          null}
          <div className="absolute inset-0 bg-black/30" />

          {/* Photo controls — top-right (creator only) */}
          {isMember && group.created_by_id === user?.id &&
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <label className="cursor-pointer">
                <div className="inline-flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md hover:bg-card transition-colors text-caption font-medium text-foreground">
                  <Camera className="w-4 h-4 text-primary" />
                  {group.group_photo_url ? 'Change' : 'Add'}
                </div>
                <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
                disabled={uploadingPhoto} />
              
              </label>
              {group.group_photo_url &&
            <button
              onClick={handleOpenPositionDialog}
              className="inline-flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md hover:bg-card transition-colors text-caption font-medium text-foreground">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                  </svg>
                  Position
                </button>
            }
              {uploadingPhoto &&
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            }
            </div>
          }
        </div>
      </div>

      {/* Member cards — clustered overlapping cards */}
      <div className="flex justify-center -mt-12 relative z-20">
        <div className="flex -space-x-4">
          {(group.member_names || []).slice(0, 5).map((name, i) => {
            const photo = group.member_photos?.[i] || (group.member_ids?.[i] === user?.id ? user?.photo_url : null);
            return (
              <div
                key={i}
                className="w-20 h-20 rounded-2xl shadow-lg border-[3px] border-background overflow-hidden flex-shrink-0"
                style={{ zIndex: 5 - i }}>
                <SafeImage src={photo} alt={name} className="w-full h-full object-cover" fallback={<div className="w-full h-full bg-accent flex items-center justify-center"><span className="text-xl font-heading font-bold text-primary">{name.charAt(0).toUpperCase()}</span></div>} />
              </div>);

          })}
          {(group.member_names || []).length > 5 &&
          <div className="w-20 h-20 rounded-2xl shadow-lg border-[3px] border-background bg-muted flex items-center justify-center flex-shrink-0" style={{ zIndex: 0 }}>
              <span className="text-sm font-semibold text-muted-foreground">
                +{group.member_names.length - 5}
              </span>
            </div>
          }
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <p className="text-caption text-muted-foreground flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          {group.member_names?.length || group.member_ids?.length || 0} members
        </p>
        <p className="text-caption text-muted-foreground flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4" />
          Created {format(new Date(group.created_date), 'MMM d, yyyy')}
        </p>
      </div>

      {/* Content tabs */}
      <div className="page-sections mt-6 pb-8">
        <Tabs defaultValue="feed">
          <TabsList className="w-full bg-secondary/50 rounded-xl h-10 mb-4">
            <TabsTrigger value="feed" className="rounded-lg text-caption flex-1 gap-1">
              <MessageCircle className="w-3 h-3" /> Feed
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-lg text-caption flex-1 gap-1">
              <Users className="w-3 h-3" /> Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-3">
            {isMember && sharedMemories.length > 0 &&
            <KeepsakeCard
              interactive
              padding={false}
              className="flex items-center gap-3 p-3 border-primary/20 bg-primary/5 cursor-pointer"
              onClick={() => navigate(`/groups/${id}/story`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/groups/${id}/story`)}
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-body font-medium text-primary">View Story</p>
                <p className="text-caption">See all shared memories in a timeline</p>
              </div>
              <ChevronRight className="w-4 h-4 text-primary" />
            </KeepsakeCard>
            }
            {!isMember ? (
              <EmptyState
                prompt="Join to see the feed"
                subtitle="Once you're added to this circle, you'll see shared memories here."
                illustration={<Users className="w-8 h-8 text-primary/50" />}
              />
            ) : sharedMemories.length === 0 ? (
              <EmptyState
                prompt="No shared memories yet"
                subtitle="When members share memories, they'll appear here."
                illustration={<Share2 className="w-8 h-8 text-primary/50" />}
                action={
                  <Button onClick={() => navigate('/create')} className="rounded-xl gap-2">
                    <Share2 className="w-4 h-4" /> Share Your First Memory
                  </Button>
                }
              />
            ) : (
            sharedMemories.map((memory, i) => {
              const memberIdx = group.member_ids?.indexOf(memory.created_by_id);
              const authorName = memberIdx >= 0 ? group.member_names?.[memberIdx] : 'A member';
              const authorPhoto = memberIdx >= 0 ? group.member_photos?.[memberIdx] : null;
              const isAuthor = memory.created_by_id === user?.id;
              const avatarPhoto = memory.loved_one_photo_url || (isAuthor ? user?.photo_url : authorPhoto);
              const avatarLabel = memory.loved_one_name || (isAuthor ? 'You' : authorName);
              return (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <KeepsakeCard padding={false} className="overflow-hidden">
                  {/* Post header — social media style */}
                  <div className="flex items-center justify-between p-3 pb-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <SafeImage src={avatarPhoto} alt="" className="w-full h-full object-cover" fallback={<span className="text-xs font-bold text-primary">{avatarLabel.charAt(0).toUpperCase()}</span>} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-body font-semibold leading-tight truncate">
                          {memory.loved_one_name || (isAuthor ? 'You' : authorName)}
                        </p>
                        <p className="text-caption">
                          {format(new Date(memory.memory_date || memory.created_date), 'MMM d')}
                          {memory.loved_one_name && ` · ${isAuthor ? 'you' : authorName}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/memory/${memory.id}`)}
                      className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </button>
                  </div>

                  {/* Post content */}
                  <button
                    onClick={() => navigate(`/memory/${memory.id}`)}
                    className="w-full text-left px-3 py-2"
                  >
                    <h4 className="text-section-title text-[15px] mb-0.5">{memory.title}</h4>
                    {memory.content &&
                    <p className="text-body text-muted-foreground leading-relaxed line-clamp-4">{memory.content}</p>
                    }
                  </button>

                  {memory.media_url && memory.memory_type === 'photo' &&
                  <button onClick={() => navigate(`/memory/${memory.id}`)} className="w-full">
                      <img src={memory.media_url} alt="" className="w-full object-cover max-h-80" loading="lazy" />
                    </button>
                  }

                  <div className="px-3 pb-1.5 pt-0.5">
                    <MemoryInteractions memoryId={memory.id} compact />
                  </div>
                  </KeepsakeCard>
                </motion.div>);

            })
            )}
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-2">
              <p className="text-overline text-muted-foreground mb-2">Members</p>
              {(group.member_names || []).map((name, i) => {
                const memberId = group.member_ids?.[i];
                const isSelf = memberId === user?.id;
                const photo = group.member_photos?.[i] || (isSelf ? user?.photo_url : null);
                return (
                  <KeepsakeCard key={i} padding={false} className="flex items-center gap-3 p-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden ${!photo ? 'bg-primary/10' : ''}`}>
                      <SafeImage src={photo} alt={name} className="w-full h-full object-cover" fallback={<span className="text-sm font-medium text-primary">{name.charAt(0).toUpperCase()}</span>} />
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium">{name}{isSelf ? ' (you)' : ''}</p>
                      <p className="text-caption">Member</p>
                    </div>
                    {isMember &&
                    <button
                      onClick={() => handleRemove(memberId, name, isSelf)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title={isSelf ? 'Leave circle' : 'Remove member'}>
                      
                        {isSelf ? <LogIn className="w-4 h-4 rotate-180" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    }
                  </KeepsakeCard>);

              })}

              <Button
                variant="outline"
                onClick={() => setShowInvite(true)}
                className="w-full rounded-xl gap-2 mt-3">
                
                <UserPlus className="w-4 h-4" /> Add Friends
              </Button>

              {group.created_by_id === user?.id &&
              <Button
                variant="ghost"
                onClick={handleDeleteCircle}
                className="w-full rounded-xl gap-2 mt-1 text-destructive hover:bg-destructive/10 hover:text-destructive">
                
                  <Trash2 className="w-4 h-4" /> Delete Circle
                </Button>
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo position dialog */}
      <Dialog open={showPositionDialog} onOpenChange={(open) => {
        if (!open) setShowPositionDialog(false);
      }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-section-title">Position the photo</DialogTitle>
            <p className="text-caption mt-1">
              Drag the frame or use arrows — the area inside will be visible
            </p>
          </DialogHeader>
          <div className="pt-2 space-y-4">
          <div
              className="relative w-full rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
              style={{ aspectRatio: '4/3' }}
              onMouseDown={(e) => {setIsDragging(true);handleFrameDrag(e);}}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleFrameDrag}
              onTouchStart={(e) => {setIsDragging(true);}}
              onTouchEnd={() => setIsDragging(false)}
              onTouchMove={(e) => {
                if (!isDragging) return;
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const cx = (touch.clientX - rect.left) / rect.width * 100;
                const cy = (touch.clientY - rect.top) / rect.height * 100;
                setFrameOffset({
                  x: Math.max(0, Math.min(20, Math.round(cx - 40))),
                  y: Math.max(0, Math.min(65, Math.round(cy - 18)))
                });
              }}>
              
            {group.group_photo_url &&
              <img
                src={group.group_photo_url}
                alt=""
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }} />

              }
            {/* Dimming overlay above frame */}
            <div className="absolute top-0 left-0 right-0 bg-black/40 pointer-events-none" style={{ height: `${frameOffset.y}%` }} />
            {/* Dimming overlay below frame */}
            <div className="absolute left-0 right-0 bottom-0 bg-black/40 pointer-events-none" style={{ height: `${65 - frameOffset.y}%` }} />
            {/* Dotted frame */}
            <div
                className="absolute border-2 border-white border-dashed rounded-lg pointer-events-none"
                style={{
                  top: `${frameOffset.y}%`,
                  left: `${frameOffset.x}%`,
                  width: '80%',
                  height: '35%'
                }} />
              
          </div>

          {/* Arrow nudge controls */}
          <div className="flex items-center justify-center gap-6">
            <div className="grid grid-cols-3 gap-1.5">
              <div />
              <button
                  onClick={() => setFrameOffset((p) => ({ ...p, y: Math.max(0, p.y - 5) }))}
                  className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 19V5m-5 5l5-5 5 5" /></svg>
              </button>
              <div />
              <button
                  onClick={() => setFrameOffset((p) => ({ ...p, x: Math.max(0, p.x - 5) }))}
                  className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5m5-5L5 12l5 5" /></svg>
              </button>
              <button
                  onClick={handleCenterFrame}
                  className="w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></svg>
              </button>
              <button
                  onClick={() => setFrameOffset((p) => ({ ...p, x: Math.min(20, p.x + 5) }))}
                  className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-5-5l5 5-5 5" /></svg>
              </button>
              <div />
              <button
                  onClick={() => setFrameOffset((p) => ({ ...p, y: Math.min(65, p.y + 5) }))}
                  className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14m-5-5l5 5 5-5" /></svg>
              </button>
              <div />
            </div>
          </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setShowPositionDialog(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSavePosition} className="rounded-xl">
            Save
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Friends dialog */}
      <Dialog open={showInvite} onOpenChange={(open) => {
        setShowInvite(open);
        if (!open) setSelectedFriends([]);
      }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-section-title">Add Friends to {group.name}</DialogTitle>
            <p className="text-caption mt-1">
              Select friends to add to this circle
            </p>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {selectedFriends.length > 0 &&
            <div className="flex flex-wrap gap-1.5">
                {selectedFriends.map((f) =>
              <span key={f.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                    {f.full_name}
                    <button onClick={() => toggleFriend(f)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
              )}
              </div>
            }
            <div className="max-h-64 overflow-y-auto bg-secondary/30 rounded-xl p-3">
              <UsernameSearch
                onSelect={toggleFriend}
                selectedIds={selectedFriends.map((f) => f.id)}
                existingMemberIds={group?.member_ids || []}
              />
              <div className="my-3 border-t border-border/30" />
              <p className="text-xs text-muted-foreground font-medium mb-2 mt-3">Your Friends</p>
              <MyFriends
                onSelect={toggleFriend}
                selectedIds={selectedFriends.map((f) => f.id)}
                compact />
              
            </div>
            <Button
              onClick={() => addMembersMutation.mutate()}
              disabled={selectedFriends.length === 0 || addMembersMutation.isPending}
              className="w-full rounded-xl gap-2">
              
              <UserPlus className="w-4 h-4" />
              {addMembersMutation.isPending ? 'Adding...' : `Add ${selectedFriends.length} Friend(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove member / Leave circle confirmation */}
      <AlertDialog open={!!removeConfirm} onOpenChange={(open) => { if (!open) setRemoveConfirm(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg">
              {removeConfirm?.isSelf ? 'Leave circle?' : 'Remove member?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removeConfirm?.isSelf
                ? `You'll leave "${group?.name}" and it will no longer appear in your circles.`
                : `${removeConfirm?.name} will be removed from this circle.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              onClick={confirmRemove}
            >
              {removeConfirm?.isSelf ? 'Leave Circle' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete circle confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg">Delete circle?</AlertDialogTitle>
            <AlertDialogDescription>
              "{group?.name}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={confirmDeleteCircle}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}