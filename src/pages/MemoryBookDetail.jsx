import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Trash2, CheckCircle2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import TemplatePickerDialog from '@/components/memorybooks/TemplatePickerDialog';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { generateStoryPDF } from '@/lib/generateStoryPDF';

function BookStatusPill({ status }) {
  const config = {
    ready: { label: 'Ready', className: 'bg-primary/10 text-primary' },
    generating: { label: 'Generating', className: 'bg-secondary text-foreground' },
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  };
  const { label, className } = config[status] || config.draft;
  return <span className={`text-caption font-medium px-2 py-0.5 rounded-full ${className}`}>{label}</span>;
}

export default function MemoryBookDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showAddMemories, setShowAddMemories] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ['memoryBook', id],
    queryFn: () => base44.entities.MemoryBook.filter({ id }),
    select: (data) => data[0],
  });

  const { data: allMemories = [] } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id }, '-created_date');
    },
    enabled: showAddMemories,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.MemoryBook.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memoryBook', id] });
      setShowAddMemories(false);
      setSelected([]);
    },
  });

  const removeMemory = (memId) => {
    const updated = (book.memory_ids || []).filter(m => m !== memId);
    updateMutation.mutate({ memory_ids: updated });
  };

  const addSelected = () => {
    const existing = book.memory_ids || [];
    const merged = [...new Set([...existing, ...selected])];
    updateMutation.mutate({ memory_ids: merged });
  };

  const toggleSelect = (memId) => {
    setSelected(prev =>
      prev.includes(memId) ? prev.filter(m => m !== memId) : [...prev, memId],
    );
  };

  const handleGeneratePDF = async (templateId) => {
    if (!book || bookMemories.length === 0) return;
    setIsGeneratingPDF(true);
    setShowTemplatePicker(false);
    try {
      const person = {
        name: book.loved_one_name || book.title,
        photo_url: book.cover_photo_url || null,
        personal_notes: book.description || null,
      };
      await generateStoryPDF(person, bookMemories, templateId);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not create the PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const { data: bookMemories = [] } = useQuery({
    queryKey: ['bookMemories', book?.memory_ids],
    queryFn: async () => {
      const ids = book?.memory_ids || [];
      if (ids.length === 0) return [];
      const results = await Promise.all(
        ids.map(async (memId) => {
          const res = await base44.functions.invoke('getMemory', { memoryId: memId });
          return res.data?.memory || null;
        }),
      );
      return results.filter(Boolean).sort(
        (a, b) => new Date(a.memory_date || a.created_date) - new Date(b.memory_date || b.created_date),
      );
    },
    enabled: !!book,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Memory book" showBack />
        <EmptyState
          prompt="Book not found"
          subtitle="This collection may have been removed."
          illustration={<BookOpen className="w-8 h-8 text-primary/50" />}
        />
      </div>
    );
  }

  const notYetAdded = allMemories.filter(m => !(book.memory_ids || []).includes(m.id));

  return (
    <div className="min-h-screen">
      <PageHeader
        title={book.title}
        subtitle={book.loved_one_name ? `For ${book.loved_one_name}` : undefined}
        showBack
        action={
          <Dialog open={showAddMemories} onOpenChange={setShowAddMemories}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-section-title">Add memories</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 pt-2">
                {notYetAdded.length === 0 && (
                  <p className="text-body text-muted-foreground text-center py-6">All memories are already in this book.</p>
                )}
                {notYetAdded.map(memory => (
                  <button
                    key={memory.id}
                    type="button"
                    onClick={() => toggleSelect(memory.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      selected.includes(memory.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${selected.includes(memory.id) ? 'text-primary' : 'text-muted-foreground/30'}`} />
                      <div className="min-w-0 text-left">
                        <p className="text-body font-medium truncate">{memory.title}</p>
                        {memory.memory_date && (
                          <p className="text-caption">{format(new Date(memory.memory_date), 'MMM d, yyyy')}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {selected.length > 0 && (
                  <Button
                    onClick={addSelected}
                    disabled={updateMutation.isPending}
                    className="w-full rounded-xl mt-2"
                  >
                    Add {selected.length} {selected.length === 1 ? 'memory' : 'memories'}
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <KeepsakeCard className="flex items-center gap-4">
          <div className="w-14 h-20 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 border border-border/50">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            {book.description && <p className="text-body text-muted-foreground mb-2">{book.description}</p>}
            <div className="flex items-center gap-2 flex-wrap">
              <BookStatusPill status={book.status} />
              <span className="text-caption text-muted-foreground">{bookMemories.length} memories</span>
            </div>
          </div>
        </KeepsakeCard>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-section-title">Memories in this book</h2>
          {bookMemories.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl gap-1 shrink-0"
              onClick={() => setShowTemplatePicker(true)}
              disabled={isGeneratingPDF}
            >
              <Download className="w-4 h-4" />
              {isGeneratingPDF ? 'Generating…' : 'PDF'}
            </Button>
          )}
        </div>

        {bookMemories.length === 0 ? (
          <EmptyState
            prompt="Start curating this collection"
            subtitle='Tap "Add" to choose memories for this book.'
            illustration={<BookOpen className="w-8 h-8 text-primary/50" />}
          />
        ) : (
          <div className="space-y-3">
            {bookMemories.map((memory, i) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <KeepsakeCard padding={false} className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium">{memory.title}</p>
                    {memory.content && (
                      <p className="text-caption mt-0.5 line-clamp-2">{memory.content}</p>
                    )}
                    {memory.memory_date && (
                      <p className="text-caption mt-1">{format(new Date(memory.memory_date), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMemory(memory.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Remove from book"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </KeepsakeCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <TemplatePickerDialog
        open={showTemplatePicker}
        onOpenChange={setShowTemplatePicker}
        onGenerate={handleGeneratePDF}
        isGenerating={isGeneratingPDF}
      />
    </div>
  );
}
