import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/AuthContext';
import useLovedOnes from '../hooks/useLovedOnes';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import CreateMemorySkeleton from '../components/memories/CreateMemorySkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FileText, Mic, Camera, Video, Upload, Heart, Calendar, Tag, Square, EyeOff } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer';
import SafeImage from '../components/shared/SafeImage';
import GeotagInput from '../components/shared/GeotagInput';
import ShareOptions from '../components/shared/ShareOptions';
import { syncMemoryShares } from '../lib/syncMemoryShares';
import {
  buildMemoryFormDefaults,
  getScheduledDeliveryError,
  memoryFormSchema,
  toMemoryPayload,
} from '@/lib/schemas/memory';
import { motion, AnimatePresence } from 'framer-motion';

const emotions = [
  { value: 'love', label: 'Love' },
  { value: 'pride', label: 'Pride' },
  { value: 'joy', label: 'Joy' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'nostalgia', label: 'Nostalgia' },
  { value: 'hope', label: 'Hope' },
  { value: 'strength', label: 'Strength' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'funny', label: 'Funny' },
];

const typeConfig = {
  text: { icon: FileText, label: 'Write' },
  voice: { icon: Mic, label: 'Voice' },
  photo: { icon: Camera, label: 'Photo' },
  video: { icon: Video, label: 'Video' },
};

export default function CreateMemory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const shareFriendFromState = location.state?.shareWithFriend;
  const editId = searchParams.get('edit');
  const forId = searchParams.get('for');
  const shareWithId = searchParams.get('shareWith') || shareFriendFromState?.id || null;
  const shareWithName = searchParams.get('shareWithName') || shareFriendFromState?.full_name || '';
  const initialType = searchParams.get('type') || 'text';
  const forPrefilled = useRef(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [formReady, setFormReady] = useState(!editId);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [recipientDrawerOpen, setRecipientDrawerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(memoryFormSchema),
    defaultValues: buildMemoryFormDefaults({ initialType, shareWithId }),
  });

  const form = watch();

  const isMobile = useIsMobile();

  const { data: lovedOnes = [] } = useLovedOnes();

  useEffect(() => {
    if (editId || !forId || forPrefilled.current || lovedOnes.length === 0) return;
    const person = lovedOnes.find((p) => p.id === forId);
    if (person) {
      forPrefilled.current = true;
      setValue('loved_one_id', person.id);
      setValue('loved_one_name', person.name || '');
      setValue('loved_one_photo_url', person.photo_url || '');
    }
  }, [forId, lovedOnes, editId, setValue]);

  // Load existing memory for editing
  const { data: existingMemory } = useQuery({
    queryKey: ['memory', editId],
    queryFn: async () => {
      const list = await base44.entities.Memory.filter({ id: editId });
      return list[0];
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingMemory && !formReady) {
      reset({
        title: existingMemory.title || '',
        content: existingMemory.content || '',
        memory_type: existingMemory.memory_type || 'text',
        loved_one_id: existingMemory.loved_one_id || '',
        loved_one_name: existingMemory.loved_one_name || '',
        loved_one_photo_url: existingMemory.loved_one_photo_url || '',
        memory_date: existingMemory.memory_date || new Date().toISOString().split('T')[0],
        media_url: existingMemory.media_url || '',
        tags: existingMemory.tags || [],
        emotion: existingMemory.emotion || '',
        is_scheduled: existingMemory.is_scheduled || false,
        scheduled_date: existingMemory.scheduled_date || '',
        scheduled_time: existingMemory.scheduled_time || '09:00',
        scheduled_occasion: existingMemory.scheduled_occasion || '',
        location_name: existingMemory.location_name || '',
        location_lat: existingMemory.location_lat ?? null,
        location_lng: existingMemory.location_lng ?? null,
        is_private: existingMemory.is_private !== false,
        share_with_ids: existingMemory.share_with_ids || [],
        share_group_ids: existingMemory.share_group_ids || [],
        share_text: existingMemory.share_text !== undefined ? existingMemory.share_text : true,
        share_photo: existingMemory.share_photo !== undefined ? existingMemory.share_photo : true,
        share_voice: existingMemory.share_voice !== undefined ? existingMemory.share_voice : false,
        share_video: existingMemory.share_video !== undefined ? existingMemory.share_video : true,
      });
      setFormReady(true);
    }
  }, [existingMemory, formReady, reset]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const memory = editId
        ? await base44.entities.Memory.update(editId, data)
        : await base44.entities.Memory.create(data);
      const memoryId = memory?.id || editId;
      if (memoryId && user && !data.is_private && (data.share_with_ids?.length > 0)) {
        await syncMemoryShares({ ...memory, ...data, id: memoryId });
      }
      return memory;
    },
    onSuccess: (memory) => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['memory', editId] });
      queryClient.invalidateQueries({ queryKey: ['memoryShares'] });
      queryClient.invalidateQueries({ queryKey: ['pendingShares'] });
      navigate(editId ? `/memory/${editId}` : memory?.id ? `/memory/${memory.id}` : '/');
    },
    onError: (err) => {
      setScheduleError(err?.message || 'Failed to save. Please try again.');
    },
  });

  const validateFile = (file) => {
    const MAX_SIZES = { image: 20 * 1024 * 1024, video: 50 * 1024 * 1024, audio: 10 * 1024 * 1024 };
    const ALLOWED = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      audio: ['audio/webm', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg'],
    };

    const memoryType = getValues('memory_type');
    const type = memoryType === 'voice' ? 'audio' : memoryType;
    const allowedTypes = ALLOWED[type] || [];
    const maxSize = MAX_SIZES[type] || 20 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      const extensions = allowedTypes.map((t) => t.split('/')[1]).join(', ');
      return `Unsupported file type. Allowed: ${extensions}`;
    }
    if (file.size > maxSize) {
      const mb = (maxSize / (1024 * 1024)).toFixed(0);
      return `File too large. Maximum: ${mb}MB`;
    }
    return null;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) { setScheduleError(error); return; }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setValue('media_url', file_url);
    setUploading(false);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      if (blob.size > 10 * 1024 * 1024) { setScheduleError('Recording too large. Maximum: 10MB'); stream.getTracks().forEach((t) => t.stop()); return; }
      const file = new File([blob], 'voice-memory.webm', { type: 'audio/webm' });
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setValue('media_url', file_url);
      setUploading(false);
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const addTag = () => {
    const tags = getValues('tags');
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setValue('tags', getValues('tags').filter((t) => t !== tag));
  };

  const onSubmit = (values) => {
    setScheduleError('');

    const deliveryError = getScheduledDeliveryError(values, lovedOnes);
    if (deliveryError) {
      setScheduleError(deliveryError);
      return;
    }

    createMutation.mutate(toMemoryPayload(values, user));
  };

  const selectLovedOne = (id) => {
    setScheduleError('');
    if (!id) {
      setValue('loved_one_id', '');
      setValue('loved_one_name', '');
      setValue('loved_one_photo_url', '');
    } else {
      const person = lovedOnes.find((p) => p.id === id);
      setValue('loved_one_id', id);
      setValue('loved_one_name', person?.name || '');
      setValue('loved_one_photo_url', person?.photo_url || '');
    }
    setRecipientDrawerOpen(false);
  };

  const setPrivate = (isPrivate) => {
    setValue('is_private', isPrivate);
    if (isPrivate) {
      setValue('share_with_ids', []);
      setValue('share_group_ids', []);
      setValue('is_scheduled', false);
      setValue('scheduled_date', '');
      setValue('scheduled_occasion', '');
    }
  };

  const updateShareOptions = (data) => {
    Object.entries(data).forEach(([key, value]) => setValue(key, value));
  };

  const updateLocation = (loc) => {
    Object.entries(loc).forEach(([key, value]) => setValue(key, value));
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title={editId ? 'Edit Memory' : 'New Memory'}
        subtitle={editId ? 'Make changes to this memory' : 'Capture a moment worth keeping'}
        showBack
      />

      {editId && !formReady ? (
        <CreateMemorySkeleton />
      ) : (
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="page-sections pb-8"
        >
          <KeepsakeCard padding={false} className="p-3">
            <p className="text-caption px-1 pb-2">What kind of memory?</p>
            <div className="flex gap-2">
              {Object.entries(typeConfig).map(([type, config]) => {
                const Icon = config.icon;
                const isActive = form.memory_type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('memory_type', type)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/50 hover:border-border hover:bg-secondary/40'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-caption font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </KeepsakeCard>

          <KeepsakeCard className="space-y-5">
            <div className="space-y-2">
              <Label>
                Who is this memory for?
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </Label>
              {isMobile ? (
                <Drawer open={recipientDrawerOpen} onOpenChange={setRecipientDrawerOpen}>
                  <DrawerTrigger asChild>
                    <button type="button" className="w-full rounded-xl h-12 border border-input bg-transparent px-3 flex items-center justify-between text-body">
                      {form.loved_one_id
                        ? `${form.loved_one_name} (${lovedOnes.find(p => p.id === form.loved_one_id)?.relationship || ''})`
                        : 'Select a person'}
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="rounded-t-2xl">
                    <DrawerHeader>
                      <DrawerTitle className="text-section-title">Who is this for?</DrawerTitle>
                    </DrawerHeader>
                    <div data-vaul-no-drag className="px-4 pb-8 space-y-1 max-h-64 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => selectLovedOne('')}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-secondary transition-colors text-body"
                      >
                        No specific person
                      </button>
                      {lovedOnes.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectLovedOne(p.id)}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-secondary transition-colors text-body flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                            <SafeImage src={p.photo_url} alt="" className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">{p.name[0]}</div>} />
                          </div>
                          <span>{p.name} ({p.relationship})</span>
                        </button>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Select value={form.loved_one_id || 'none'} onValueChange={(v) => selectLovedOne(v === 'none' ? '' : v)}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific person</SelectItem>
                    {lovedOnes.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.relationship})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Give this memory a name…"
                {...register('title')}
                className="rounded-xl h-12"
              />
              {errors.title && (
                <p className="text-caption text-destructive">{errors.title.message}</p>
              )}
            </div>
          </KeepsakeCard>

          <KeepsakeCard>
            <AnimatePresence mode="wait">
              {form.memory_type === 'text' && (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Label>Your words</Label>
                  <Textarea
                    placeholder="Write from the heart…"
                    {...register('content')}
                    className="rounded-xl min-h-[150px] resize-none leading-relaxed text-body"
                  />
                </motion.div>
              )}

              {form.memory_type === 'voice' && (
                <motion.div key="voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <Label>Voice recording</Label>
                  <div className="bg-secondary/50 rounded-2xl p-6 text-center space-y-4">
                    {!form.media_url ? (
                      <>
                        <button
                          type="button"
                          onClick={recording ? stopRecording : startRecording}
                          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all ${
                            recording ? 'bg-destructive animate-pulse' : 'bg-primary'
                          }`}
                        >
                          {recording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-primary-foreground" />}
                        </button>
                        <p className="text-caption">
                          {recording ? 'Recording… tap to stop' : uploading ? 'Saving recording…' : 'Tap to start recording'}
                        </p>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <audio src={form.media_url} controls className="w-full" />
                        <Button type="button" variant="ghost" size="sm" onClick={() => setValue('media_url', '')}>
                          Record again
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    placeholder="Add a note about this recording (optional)…"
                    {...register('content')}
                    className="rounded-xl min-h-[80px] resize-none text-body"
                  />
                </motion.div>
              )}

              {(form.memory_type === 'photo' || form.memory_type === 'video') && (
                <motion.div key="media" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <Label>{form.memory_type === 'photo' ? 'Photo' : 'Video'}</Label>
                  {!form.media_url ? (
                    <label className="cursor-pointer block">
                      <input type="file" accept={form.memory_type === 'photo' ? 'image/*' : 'video/*'} className="hidden" onChange={handleFileUpload} />
                      <div className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-secondary/30 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-caption">
                          {uploading ? 'Uploading…' : `Tap to upload a ${form.memory_type}`}
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="space-y-2">
                      {form.memory_type === 'photo' ? (
                        <img src={form.media_url} alt="Preview" className="w-full rounded-2xl" />
                      ) : (
                        <video src={form.media_url} controls className="w-full rounded-2xl" />
                      )}
                      <Button type="button" variant="ghost" size="sm" onClick={() => setValue('media_url', '')}>
                        Choose different file
                      </Button>
                    </div>
                  )}
                  <Textarea
                    placeholder="Describe this moment (optional)…"
                    {...register('content')}
                    className="rounded-xl min-h-[80px] resize-none text-body"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </KeepsakeCard>

          <KeepsakeCard className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> When did this happen?
              </Label>
              <Input
                type="date"
                {...register('memory_date')}
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>How does this make you feel?</Label>
              <div className="flex flex-wrap gap-2">
                {emotions.map(em => (
                  <button
                    key={em.value}
                    type="button"
                    onClick={() => setValue('emotion', form.emotion === em.value ? '' : em.value)}
                    className={`px-3 py-1.5 rounded-full text-caption border transition-all ${
                      form.emotion === em.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/40'
                    }`}
                  >
                    {em.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="rounded-xl h-10"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag} className="rounded-xl h-10">Add</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="px-2.5 py-1 bg-secondary rounded-full text-caption hover:bg-destructive/10 transition-colors"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </KeepsakeCard>

          <KeepsakeCard className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body font-medium flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5" /> Keep this memory private
                </p>
                <p className="text-caption mt-0.5">
                  Only you can see it — not shared, scheduled, or included in legacy delivery
                </p>
              </div>
              <Switch
                checked={form.is_private}
                onCheckedChange={setPrivate}
              />
            </div>
          </KeepsakeCard>

          {!form.is_private && (
          <KeepsakeCard className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body font-medium">Schedule for future delivery</p>
                <p className="text-caption mt-0.5">Revealed on a special day</p>
              </div>
              <Switch
                checked={form.is_scheduled}
                onCheckedChange={(v) => setValue('is_scheduled', v)}
              />
            </div>
            {form.is_scheduled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <Input
                    type="date"
                    {...register('scheduled_date')}
                    className="rounded-xl h-10 flex-1"
                  />
                  <Select
                    value={form.scheduled_time || '09:00'}
                    onValueChange={(v) => setValue('scheduled_time', v)}
                  >
                    <SelectTrigger className="rounded-xl h-10 w-32">
                      <SelectValue placeholder="9:00 AM" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[280px]">
                      {Array.from({ length: 24 }, (_, h) => {
                        const period = h < 12 ? 'AM' : 'PM';
                        const hour12 = h % 12 || 12;
                        return (
                          <SelectItem key={h} value={`${String(h).padStart(2, '0')}:00`}>
                            {`${hour12}:00 ${period}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Occasion (e.g., 18th birthday, wedding day)"
                  {...register('scheduled_occasion')}
                  className="rounded-xl h-10"
                />
              </motion.div>
            )}
          </KeepsakeCard>
          )}

          <KeepsakeCard>
            <GeotagInput
              locationName={form.location_name}
              onLocationChange={updateLocation}
            />
          </KeepsakeCard>

          {!form.is_private && (
          <KeepsakeCard>
            <ShareOptions
              key={shareWithId || 'share'}
              shareWithIds={form.share_with_ids}
              shareGroupIds={form.share_group_ids}
              shareText={form.share_text}
              sharePhoto={form.share_photo}
              shareVoice={form.share_voice}
              shareVideo={form.share_video}
              defaultExpandFriends={Boolean(shareWithId) || (form.share_with_ids?.length > 0)}
              prefilledFriends={
                shareWithId
                  ? [{
                    id: shareWithId,
                    full_name: shareWithName || shareFriendFromState?.full_name || 'Friend',
                    photo_url: shareFriendFromState?.photo_url || '',
                    username: shareFriendFromState?.username || '',
                  }]
                  : []
              }
              onChange={updateShareOptions}
            />
          </KeepsakeCard>
          )}

          {scheduleError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive bg-destructive/5 rounded-xl px-3 py-2"
            >
              {scheduleError}
            </motion.p>
          )}

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full h-12 rounded-xl gap-2"
          >
            <Heart className="w-4 h-4" />
            {createMutation.isPending ? (editId ? 'Saving…' : 'Preserving…') : (editId ? 'Save changes' : 'Preserve this memory')}
          </Button>
        </motion.form>
      )}
    </div>
  );
}