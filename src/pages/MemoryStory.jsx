import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import EmptyState from '../components/shared/EmptyState';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Image, Mic, Calendar, Heart, Quote, Play, Pause, Download } from 'lucide-react';
import SafeImage from '../components/shared/SafeImage';
import { generateMemoryStoryPDF } from '../lib/generateMemoryStoryPDF';
import TemplatePickerDialog from '../components/memorybooks/TemplatePickerDialog';

const themeColors = {
  amber: { line: 'bg-primary/30', dot: 'bg-primary', accent: 'text-primary', card: 'border-primary/20' },
  rose: { line: 'bg-primary/25', dot: 'bg-primary', accent: 'text-primary', card: 'border-primary/15' },
  lavender: { line: 'bg-primary/20', dot: 'bg-primary', accent: 'text-primary', card: 'border-border/50' },
  sage: { line: 'bg-primary/20', dot: 'bg-primary', accent: 'text-primary', card: 'border-border/50' },
  sky: { line: 'bg-primary/25', dot: 'bg-primary', accent: 'text-primary', card: 'border-primary/15' },
  coral: { line: 'bg-primary/30', dot: 'bg-primary', accent: 'text-primary', card: 'border-primary/20' },
};

const emotionPalettes = {
  love: 'from-primary/10 to-primary/5',
  joy: 'from-secondary to-secondary/50',
  pride: 'from-primary/15 to-primary/5',
  gratitude: 'from-secondary/80 to-secondary/40',
  nostalgia: 'from-primary/10 to-secondary/30',
  hope: 'from-primary/10 to-primary/5',
  milestone: 'from-primary/15 to-secondary/40',
  funny: 'from-secondary to-primary/5',
};

function ScrollReveal({ children, className = '' }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StoryMemoryCard({ memory, theme, index }) {
  const isEven = index % 2 === 0;
  const bg = emotionPalettes[memory.emotion] || 'from-card to-card';
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  return (
    <div className={`flex gap-4 ${isEven ? 'flex-row' : 'flex-row-reverse'} items-start`}>
      <div className="relative flex-shrink-0 z-10">
        <div className={`w-3 h-3 rounded-full ${theme.dot} shadow-lg mt-6`} />
      </div>

      <KeepsakeCard
        padding={false}
        className={`flex-1 bg-gradient-to-br ${bg} border ${theme.card} overflow-hidden`}
      >
        {memory.memory_type === 'photo' && memory.media_url && (
          <div className="relative overflow-hidden">
            <img src={memory.media_url} alt={memory.title} className="w-full object-cover max-h-80" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-caption px-2 py-0.5 rounded-full flex items-center gap-1">
              <Image className="w-3 h-3" /> Photo
            </span>
          </div>
        )}

        {memory.memory_type === 'video' && memory.media_url && (
          <div className="relative">
            <video src={memory.media_url} controls className="w-full max-h-80" />
          </div>
        )}

        {memory.memory_type === 'voice' && memory.media_url && (
          <div className="pt-5 px-5">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (audioRef.current) {
                      audioPlaying ? audioRef.current.pause() : audioRef.current.play();
                      setAudioPlaying(!audioPlaying);
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  {audioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mic className="w-3.5 h-3.5 text-primary" />
                    <span className="text-caption font-medium text-primary">Voice memory</span>
                  </div>
                  <div className="flex gap-0.5 items-end h-6">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary/30 rounded-full"
                        style={{ height: `${Math.random() * 24 + 4}px`, opacity: audioPlaying ? 0.8 : 0.4 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <audio ref={audioRef} src={memory.media_url} onEnded={() => setAudioPlaying(false)} className="hidden" />
            </div>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-caption text-muted-foreground font-medium">
              {memory.memory_date
                ? format(new Date(memory.memory_date), 'MMMM d, yyyy')
                : format(new Date(memory.created_date), 'MMMM d, yyyy')}
            </span>
            {memory.emotion && (
              <span className={`text-caption px-2 py-0.5 rounded-full ${theme.accent} bg-card/80 capitalize`}>
                {memory.emotion}
              </span>
            )}
          </div>

          <h3 className="text-section-title leading-snug mb-2">{memory.title}</h3>

          {memory.content && (
            <p className="text-body text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {memory.content}
            </p>
          )}

          {memory.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {memory.tags.map(tag => (
                <span key={tag} className="text-caption text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </KeepsakeCard>
    </div>
  );
}

function YearChapter({ year, memories, theme }) {
  return (
    <div className="mb-12">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-6 pl-8">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className={`text-caption font-bold ${theme.accent}`}>{year}</span>
          </div>
          <div className={`flex-1 h-px ${theme.line}`} />
          <span className="text-caption text-muted-foreground">
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
          </span>
        </div>
      </ScrollReveal>

      <div className="relative pl-8">
        <div className={`absolute left-[5px] top-0 bottom-0 w-[2px] ${theme.line}`} />
        <div className="space-y-10">
          {memories.map((memory, i) => (
            <ScrollReveal key={memory.id}>
              <StoryMemoryCard memory={memory} theme={theme} index={i} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MemoryStory() {
  const { id } = useParams();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const { data: person, isLoading } = useQuery({
    queryKey: ['lovedOne', id],
    queryFn: async () => {
      const list = await base44.entities.LovedOne.filter({ id });
      return list[0];
    },
    enabled: !!id,
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['memories', 'lovedOne', id],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id, loved_one_id: id }, '-memory_date');
    },
    enabled: !!id && !!person,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Story" showBack />
        <EmptyState
          prompt="Profile not found"
          subtitle="This person may have been removed."
          illustration={<Heart className="w-8 h-8 text-primary/50" />}
        />
      </div>
    );
  }

  const theme = themeColors[person.profile_theme] || themeColors.amber;

  const yearGroups = memories.reduce((acc, memory) => {
    const year = memory.memory_date
      ? new Date(memory.memory_date).getFullYear()
      : new Date(memory.created_date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(memory);
    return acc;
  }, {});

  const sortedYears = Object.keys(yearGroups).sort((a, b) => Number(b) - Number(a));

  const handleDownloadPDF = async (templateId) => {
    setPdfLoading(true);
    setShowTemplatePicker(false);
    try {
      const me = await base44.auth.me();
      await generateMemoryStoryPDF({
        memories,
        lovedOnes: [person],
        privateNotes: [],
        creatorName: me?.display_name || me?.full_name || null,
        templateId,
        download: true,
        filename: `${person.name?.replace(/\s+/g, '_') || 'Memory'}_Memory_Story.pdf`,
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not create the PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Story" subtitle={person.name} showBack />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center pb-8 pt-2 page-sections"
      >
        <div className="w-20 h-20 rounded-full bg-secondary border-2 border-primary/20 overflow-hidden flex items-center justify-center mx-auto mb-4">
          <SafeImage src={person.photo_url} alt={person.name} className="w-full h-full object-cover" fallback={<Heart className="w-8 h-8 text-muted-foreground" />} />
        </div>
        <h1 className="text-section-title text-2xl sm:text-3xl">
          {person.name}&apos;s story
        </h1>
        <p className="text-caption mt-1">
          A journey through {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
        </p>
        {memories.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplatePicker(true)}
            disabled={pdfLoading}
            className="mt-3 rounded-xl gap-2"
          >
            <Download className="w-4 h-4" />
            {pdfLoading ? 'Creating…' : 'Download PDF'}
          </Button>
        )}
        {person.personal_notes && (
          <KeepsakeCard className="mt-4 max-w-md mx-auto text-left">
            <Quote className="w-5 h-5 text-primary/30 mb-2" />
            <p className="text-quote">&ldquo;{person.personal_notes}&rdquo;</p>
          </KeepsakeCard>
        )}
      </motion.div>

      <div className="page-sections pb-20">
        {sortedYears.length > 0 ? (
          sortedYears.map(year => (
            <YearChapter
              key={year}
              year={year}
              memories={[...yearGroups[year]].sort(
                (a, b) =>
                  new Date(b.memory_date || b.created_date) - new Date(a.memory_date || a.created_date),
              )}
              theme={theme}
            />
          ))
        ) : (
          <EmptyState
            prompt="The story is just beginning"
            subtitle={`Start adding memories to build ${person.name}'s timeline.`}
            illustration={<Heart className="w-8 h-8 text-primary/50" />}
          />
        )}
      </div>

      <TemplatePickerDialog
        open={showTemplatePicker}
        onOpenChange={setShowTemplatePicker}
        onGenerate={handleDownloadPDF}
        isGenerating={pdfLoading}
      />
    </div>
  );
}
