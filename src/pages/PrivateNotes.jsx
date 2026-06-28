import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useLovedOnes from '../hooks/useLovedOnes';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import EmptyState from '../components/shared/EmptyState';
import EmotionBadge from '../components/shared/EmotionBadge';
import ProfileAvatar from '../components/shared/ProfileAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, NotebookPen, Pencil, Trash2, EyeOff, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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

const emptyForm = {
  title: '',
  content: '',
  subject_friend_id: '',
  subject_friend_name: '',
  emotion: '',
};

export default function PrivateNotes() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const aboutId = searchParams.get('about');
  const openCreate = searchParams.get('new') === '1';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: lovedOnes = [] } = useLovedOnes();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['privateNotes'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const list = await base44.entities.PrivateNote.filter({ created_by_id: me.id });
      return [...list].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
  });

  const filteredNotes = useMemo(() => {
    if (!aboutId) return notes;
    return notes.filter(n => n.subject_friend_id === aboutId);
  }, [notes, aboutId]);

  const aboutPerson = lovedOnes.find(p => p.id === aboutId);

  useEffect(() => {
    if (!openCreate || lovedOnes.length === 0) return;
    const prefill = aboutId ? lovedOnes.find(p => p.id === aboutId) : null;
    setEditingNote(null);
    setForm(prefill
      ? { ...emptyForm, subject_friend_id: prefill.id, subject_friend_name: prefill.name }
      : { ...emptyForm, subject_friend_id: aboutId || '', subject_friend_name: aboutPerson?.name || '' });
    setDialogOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [openCreate, lovedOnes, aboutId, aboutPerson?.name, searchParams, setSearchParams]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        title: data.title.trim(),
        content: data.content.trim(),
        subject_friend_id: data.subject_friend_id,
        subject_friend_name: data.subject_friend_name,
        visibility: 'private_only',
        ...(data.emotion ? { emotion: data.emotion } : {}),
      };
      if (editingNote) {
        return base44.entities.PrivateNote.update(editingNote.id, payload);
      }
      return base44.entities.PrivateNote.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privateNotes'] });
      closeDialog();
      toast.success(editingNote ? 'Note updated' : 'Note saved');
    },
    onError: () => {
      toast.error('Could not save note');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PrivateNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privateNotes'] });
      setDeleteTarget(null);
      toast.success('Note deleted');
    },
    onError: () => {
      toast.error('Could not delete note');
    },
  });

  const selectPerson = (id) => {
    const person = lovedOnes.find(p => p.id === id);
    setForm(prev => ({
      ...prev,
      subject_friend_id: id,
      subject_friend_name: person?.name || '',
    }));
  };

  const openCreateDialog = (prefillPerson = null) => {
    setEditingNote(null);
    setForm(prefillPerson
      ? { ...emptyForm, subject_friend_id: prefillPerson.id, subject_friend_name: prefillPerson.name }
      : { ...emptyForm, subject_friend_id: aboutId || '', subject_friend_name: aboutPerson?.name || '' });
    setDialogOpen(true);
  };

  const openEditDialog = (note) => {
    setEditingNote(note);
    setForm({
      title: note.title || '',
      content: note.content || '',
      subject_friend_id: note.subject_friend_id || '',
      subject_friend_name: note.subject_friend_name || '',
      emotion: note.emotion || '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingNote(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject_friend_id) return;
    saveMutation.mutate(form);
  };

  const clearAboutFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('about');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Private notes"
        subtitle="Only you can see these — until legacy delivery"
        showBack
        action={
          <Button size="sm" className="rounded-xl gap-1" onClick={() => openCreateDialog()}>
            <Plus className="w-4 h-4" /> New
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <KeepsakeCard className="bg-primary/5 border-primary/20">
          <p className="text-body text-muted-foreground leading-relaxed flex items-start gap-2">
            <EyeOff className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              Write thoughts you are not ready to share yet. Private notes stay hidden from everyone
              — including the person they are about — until legacy release, if enabled.
            </span>
          </p>
        </KeepsakeCard>

        {aboutId && aboutPerson && (
          <KeepsakeCard className="flex items-center gap-3">
            <ProfileAvatar src={aboutPerson.photo_url} name={aboutPerson.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium truncate">About {aboutPerson.name}</p>
              <p className="text-caption text-muted-foreground">
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={clearAboutFilter} aria-label="Show all notes">
              <X className="w-4 h-4" />
            </Button>
          </KeepsakeCard>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <KeepsakeCard key={i} className="h-24 animate-pulse bg-secondary/40" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            illustration={<NotebookPen className="w-10 h-10 text-muted-foreground" />}
            prompt="Some words are only for you — until the right moment."
            subtitle={
              aboutPerson
                ? `No private notes about ${aboutPerson.name} yet.`
                : 'Capture feelings, reflections, or messages you are not ready to share yet.'
            }
            action={
              lovedOnes.length > 0 ? (
                <Button className="rounded-xl" onClick={() => openCreateDialog(aboutPerson || null)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Write a private note
                </Button>
              ) : (
                <Link to="/loved-ones/new">
                  <Button className="rounded-xl">Add a loved one first</Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <KeepsakeCard className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-body font-medium truncate">{note.title}</h3>
                      <p className="text-caption text-muted-foreground mt-0.5">
                        About {note.subject_friend_name || 'someone'}
                        {note.created_date && (
                          <span> · {format(new Date(note.created_date), 'MMM d, yyyy')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(note)} aria-label="Edit note">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(note)} aria-label="Delete note">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {note.emotion && <EmotionBadge emotion={note.emotion} />}
                  {note.content && (
                    <p className="text-body text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  )}
                </KeepsakeCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-section-title">
              {editingNote ? 'Edit private note' : 'New private note'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="A moment I want to remember"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Who is this about?</Label>
              {lovedOnes.length > 0 ? (
                <Select value={form.subject_friend_id || ''} onValueChange={selectPerson}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a loved one" />
                  </SelectTrigger>
                  <SelectContent>
                    {lovedOnes.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.relationship})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-body text-muted-foreground">
                  <Link to="/loved-ones/new" className="text-link underline underline-offset-2">Add a loved one</Link>
                  {' '}before writing a private note.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-content">Your words</Label>
              <Textarea
                id="note-content"
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write freely — only you can read this until legacy delivery."
                className="rounded-xl min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Emotion <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="flex flex-wrap gap-2">
                {emotions.map(em => (
                  <button
                    key={em.value}
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      emotion: prev.emotion === em.value ? '' : em.value,
                    }))}
                    className={`px-3 py-1.5 rounded-full text-caption font-medium transition-colors ${
                      form.emotion === em.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {em.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" className="flex-1 rounded-xl" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl"
                disabled={!form.title.trim() || !form.subject_friend_id || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving…' : editingNote ? 'Save changes' : 'Save note'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete private note?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
