import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useLovedOnes from '../hooks/useLovedOnes';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import MemoryCard from '../components/shared/MemoryCard';
import EmptyState from '../components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const emotions = ['love', 'pride', 'joy', 'gratitude', 'nostalgia', 'hope', 'strength', 'reflection', 'milestone', 'funny'];

export default function Search() {
  const [query, setQuery] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: lovedOnes = [] } = useLovedOnes();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['searchMemories', query, selectedEmotion, selectedPerson],
    queryFn: async () => {
      const res = await base44.functions.invoke('searchMemories', {
        query,
        emotion: selectedEmotion || undefined,
        loved_one_id: selectedPerson || undefined,
      });
      return res?.data ?? { memories: [], total: 0, hasAnyMemories: false };
    },
  });

  const filteredMemories = data?.memories ?? [];
  const hasAnyMemories = data?.hasAnyMemories ?? false;

  const clearFilters = () => {
    setSelectedEmotion('');
    setSelectedPerson('');
    setQuery('');
  };

  const hasFilters = !!query || !!selectedEmotion || !!selectedPerson;
  const searching = isLoading || isFetching;

  return (
    <div className="min-h-screen">
      <PageHeader title="Search memories" subtitle="Find moments that matter" showBack />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search by name, words, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl h-12 pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
              showFilters ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/60'
            }`}
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <KeepsakeCard className="space-y-4">
                {lovedOnes.length > 0 && (
                  <div>
                    <p className="text-overline mb-2 px-0.5">Person</p>
                    <div className="flex flex-wrap gap-2">
                      {lovedOnes.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPerson(selectedPerson === p.id ? '' : p.id)}
                          className={`px-3 py-1.5 rounded-full text-caption border transition-all ${
                            selectedPerson === p.id
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/40'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-overline mb-2 px-0.5">Emotion</p>
                  <div className="flex flex-wrap gap-2">
                    {emotions.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setSelectedEmotion(selectedEmotion === em ? '' : em)}
                        className={`px-3 py-1.5 rounded-full text-caption border capitalize transition-all ${
                          selectedEmotion === em
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/40'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-caption text-destructive hover:underline"
                  >
                    <X className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </KeepsakeCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <p className="text-caption mb-3 px-1">
            {searching
              ? 'Searching…'
              : `${filteredMemories.length} ${filteredMemories.length === 1 ? 'memory' : 'memories'} found`}
          </p>

          {searching && filteredMemories.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredMemories.length > 0 ? (
            <div className="space-y-3">
              {filteredMemories.map((memory, i) => (
                <MemoryCard key={memory.id} memory={memory} index={i} />
              ))}
            </div>
          ) : hasAnyMemories ? (
            <EmptyState
              prompt="What moment do you never want to forget?"
              subtitle="Try adjusting your search or filters."
              illustration={<SearchIcon className="w-8 h-8 text-primary/50" />}
            />
          ) : (
            <EmptyState
              prompt="Your story starts with one memory"
              subtitle="Capture a moment first, then search and filter here."
              illustration={<SearchIcon className="w-8 h-8 text-primary/50" />}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
