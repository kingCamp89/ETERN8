import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, Check } from 'lucide-react';
import { BrandSparkle } from '@/components/shared/BrandIcons';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';
import SafeImage from '@/components/shared/SafeImage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useLovedOnes from '../../hooks/useLovedOnes';

export default function QuickNote() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const { data: lovedOnes = [] } = useLovedOnes();

  const mutation = useMutation({
    mutationFn: (newMemory) => base44.entities.Memory.create(newMemory),
    onMutate: async (newMemory) => {
      await queryClient.cancelQueries({ queryKey: ['memories'] });
      const previous = queryClient.getQueryData(['memories']);
      queryClient.setQueryData(['memories'], (old = []) => [
        { ...newMemory, id: `optimistic-${Date.now()}`, created_date: new Date().toISOString() },
        ...old,
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['memories'], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setSaved(true);
      setTimeout(() => {
        setNote('');
        setSelectedPerson(null);
        setSaved(false);
        setOpen(false);
      }, 1200);
    },
  });

  const handleSave = () => {
    if (!note.trim()) return;
    mutation.mutate({
      title: note.split('\n')[0].slice(0, 60) || 'Quick note',
      content: note,
      memory_type: 'text',
      loved_one_id: selectedPerson?.id || '',
      loved_one_name: selectedPerson?.name || '',
      memory_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div>
      {/* Tap to open */}
      {!open && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen(true)}
          className="w-full text-left"
        >
          <KeepsakeCard
            interactive
            padding={false}
            className="flex items-center gap-3.5 px-4 py-3.5 border-border/40 hover:border-primary/15"
          >
            <div className="w-9 h-9 bg-primary/6 rounded-xl flex items-center justify-center flex-shrink-0">
              <BrandSparkle className="w-5 h-5 opacity-80" />
            </div>
            <div>
              <span className="text-menu-title">Quick note</span>
              <p className="text-caption mt-0.5">
                Jot down a thought before it fades
              </p>
            </div>
          </KeepsakeCard>
        </motion.button>
      )}

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border/60 rounded-2xl shadow depth-card overflow-hidden"
          >
            {/* Person picker */}
            <div className="px-4 pt-4 pb-2">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-2 text-body font-medium text-primary bg-primary/8 rounded-xl px-3 py-2 hover:bg-primary/12 transition-colors"
              >
                {selectedPerson ? (
                  <>
                    <SafeImage src={selectedPerson.photo_url} className="w-5 h-5 rounded-full object-cover" fallback={<span className="text-base">{selectedPerson.name[0]}</span>} />
                    <span>{selectedPerson.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">For who? (optional)</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showPicker ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 mt-2 pb-1">
                      <button
                        onClick={() => { setSelectedPerson(null); setShowPicker(false); }}
                        className={`text-caption px-3 py-1.5 rounded-xl border transition-colors ${!selectedPerson ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                      >
                        No one specific
                      </button>
                      {lovedOnes.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPerson(p); setShowPicker(false); }}
                          className={`flex items-center gap-1.5 text-caption px-3 py-1.5 rounded-xl border transition-colors ${selectedPerson?.id === p.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:border-primary/40'}`}
                        >
                          <SafeImage src={p.photo_url} className="w-4 h-4 rounded-full object-cover" />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Text area */}
            <textarea
              autoFocus
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Write anything… a moment, a thought, a smile they gave you today ✨"
              className="w-full px-4 py-2 text-body bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground/60 leading-relaxed"
              rows={4}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.metaKey) handleSave();
              }}
            />

            {/* Footer */}
            <div className="px-4 pb-4 flex items-center justify-between">
              <button
                onClick={() => { setOpen(false); setNote(''); setSelectedPerson(null); }}
                className="text-caption text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!note.trim() || mutation.isPending || saved}
                className="rounded-xl gap-1.5"
              >
                {saved ? (
                  <><Check className="w-3.5 h-3.5" /> Saved!</>
                ) : mutation.isPending ? (
                  'Saving…'
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Save note</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}