import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useLovedOnes from '../hooks/useLovedOnes';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import EmptyState from '../components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import BookExamples from '../components/memorybooks/BookExamples';

function BookStatusPill({ status }) {
  const config = {
    ready: { label: 'Ready', className: 'bg-primary/10 text-primary' },
    generating: { label: 'Generating', className: 'bg-secondary text-foreground' },
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  };
  const { label, className } = config[status] || config.draft;
  return (
    <span className={`text-caption font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}

export default function MemoryBooks() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', loved_one_id: '', loved_one_name: '' });

  const { data: books = [] } = useQuery({
    queryKey: ['memoryBooks'],
    queryFn: () => base44.entities.MemoryBook.list('-created_date'),
  });

  const { data: lovedOnes = [] } = useLovedOnes();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MemoryBook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memoryBooks'] });
      setShowCreate(false);
      setForm({ title: '', description: '', loved_one_id: '', loved_one_name: '' });
    },
  });

  const selectPerson = (id) => {
    const person = lovedOnes.find(p => p.id === id);
    setForm(prev => ({ ...prev, loved_one_id: id, loved_one_name: person?.name || '' }));
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Memory books"
        subtitle="Beautiful printed collections"
        showBack
        action={
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1">
                <Plus className="w-4 h-4" /> Create
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-section-title">New memory book</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Letters to Aurora"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>For</Label>
                  <Select value={form.loved_one_id} onValueChange={selectPerson}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {lovedOnes.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What makes this collection special?"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="rounded-xl resize-none text-body min-h-[80px]"
                  />
                </div>
                <Button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.title || createMutation.isPending}
                  className="w-full rounded-xl"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create book'}
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
        className="page-sections pb-8"
      >
        <BookExamples />

        {books.length > 0 ? (
          <div className="space-y-3">
            {books.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/memory-books/${book.id}`} className="block">
                  <KeepsakeCard interactive className="flex items-start gap-4">
                    <div className="w-12 h-16 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 border border-border/50">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-section-title">{book.title}</h3>
                      {book.loved_one_name && (
                        <p className="text-caption text-primary mt-0.5">For {book.loved_one_name}</p>
                      )}
                      {book.description && (
                        <p className="text-caption mt-1 line-clamp-2">{book.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <BookStatusPill status={book.status} />
                        <span className="text-caption text-muted-foreground">
                          {book.memory_ids?.length || 0} memories
                        </span>
                      </div>
                    </div>
                  </KeepsakeCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            prompt="Turn memories into a keepsake"
            subtitle="Create a beautiful collection that can be printed and held."
            illustration={<BookOpen className="w-8 h-8 text-primary/50" />}
            action={
              <Button onClick={() => setShowCreate(true)} className="rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Create your first book
              </Button>
            }
          />
        )}
      </motion.div>
    </div>
  );
}
