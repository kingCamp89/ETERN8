import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/shared/PageHeader';
import MemoryCard from '../components/shared/MemoryCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Calendar, FileText, Image, Mic, Video, Pencil, BookOpen, Download, Heart } from 'lucide-react';
import ProfileAvatar from '../components/shared/ProfileAvatar';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ProfileDetailSkeleton from '../components/profile/ProfileDetailSkeleton';
import { generateStoryPDF } from '../lib/generateStoryPDF';
import { motion } from 'framer-motion';
import { format, differenceInYears } from 'date-fns';
import { applyTheme, getGlobalTheme } from '../lib/themes';
import EditProfileDialog from '../components/profile/EditProfileDialog';
import EmptyState from '../components/shared/EmptyState';
import TemplatePickerDialog from '../components/memorybooks/TemplatePickerDialog';
import usePullToRefresh from '../hooks/usePullToRefresh';

const PAGE_SIZE = 20;

export default function ProfileDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const loadMoreRef = useRef(null);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['lovedOne', id] });
    await queryClient.invalidateQueries({ queryKey: ['profileMemories', id, activeTab] });
  }, [queryClient, id, activeTab]);

  const { indicatorRef } = usePullToRefresh(handleRefresh);

  // Fetch loved one via secure backend function
  const { data: person } = useQuery({
    queryKey: ['lovedOne', id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getLovedOne', { lovedOneId: id });
      return res.data.lovedOne;
    },
    enabled: !!id,
  });

  // Paginated memories via secure backend function
  const {
    data: memoriesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMemories,
  } = useInfiniteQuery({
    queryKey: ['profileMemories', id, activeTab],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await base44.functions.invoke('getProfileMemories', {
        lovedOneId: id,
        type: activeTab !== 'all' ? activeTab : undefined,
        limit: PAGE_SIZE,
        cursor: pageParam || undefined,
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!id,
  });

  // Flatten all pages into one array
  const allPages = memoriesData?.pages ?? [];
  const memories = allPages.flatMap(p => p.memories ?? []);

  // Aggregate type counts from first page (has all-data counts)
  const firstPage = allPages[0];
  const typeCounts = firstPage?.typeCounts ?? { text: 0, photo: 0, voice: 0, video: 0 };

  // Build year-grouped view from all loaded pages
  const memoryGroups = memories.reduce((acc, memory) => {
    const year = memory.memory_date
      ? new Date(memory.memory_date).getFullYear()
      : new Date(memory.created_date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(memory);
    return acc;
  }, {});

  const sortedYears = Object.keys(memoryGroups).sort((a, b) => b - a);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDownloadPDF = async (templateId) => {
    setPdfLoading(true);
    setShowTemplatePicker(false);
    try {
      // Fetch ALL memories for this profile (not just current infinite-scroll page)
      const res = await base44.functions.invoke('getProfileMemories', {
        lovedOneId: id,
        limit: 9999,
      });
      const allMemories = res.data?.memories || [];
      const me = await base44.auth.me();
      await generateStoryPDF(person, allMemories, templateId, me?.full_name || null);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not create the PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (person?.profile_theme) {
      applyTheme(person.profile_theme);
    }
    return () => {
      applyTheme(getGlobalTheme());
    };
  }, [person?.profile_theme]);

  if (!person) {
    return (
      <div className="min-h-screen">
        <PageHeader title="" showBack />
        <ProfileDetailSkeleton />
      </div>
    );
  }

  const yearsTogether = person.met_date
    ? differenceInYears(new Date(), new Date(person.met_date))
    : null;

  return (
    <div className="min-h-screen relative">
      <div
        ref={indicatorRef}
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10 opacity-0 transition-all"
        style={{ transform: 'translateY(0)' }}
      >
        <div className="mt-2 rounded-full bg-card/90 p-1.5 shadow depth-card">
          <LoadingSpinner size="sm" />
        </div>
      </div>
      <PageHeader title="" showBack />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
        className="page-sections pb-6"
      >
        <KeepsakeCard padding={false} className="p-6 text-center">
          <ProfileAvatar
            src={person.photo_url}
            name={person.name}
            size="xl"
            className="mx-auto mb-4"
            glow
          />
          <h1 className="text-page-title">{person.name}</h1>
          <p className="text-caption mt-1">
            {person.relationship === 'other'
              ? 'Someone special'
              : `Your ${person.relationship}`}
            {yearsTogether !== null && (
              <span> · {yearsTogether} {yearsTogether === 1 ? 'year' : 'years'} of memories</span>
            )}
          </p>

          {person.personal_notes ? (
            <div className="mt-4 rounded-2xl glass-warm border border-border/30 px-4 py-3 max-w-sm mx-auto">
              <p className="text-quote">&ldquo;{person.personal_notes}&rdquo;</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="text-link mt-4 inline-block underline underline-offset-2"
            >
              + Add a cover message
            </button>
          )}

          {person.email && (
            <p className="text-caption mt-3">
              Delivery email: {person.email}
            </p>
          )}

          <div className="flex justify-center gap-8 mt-5 pt-5 border-t border-border/30">
            <div className="text-center">
              <p className="text-stat text-primary">{memories.length}</p>
              <p className="text-caption">Memories</p>
            </div>
            <div className="text-center">
              <p className="text-stat text-foreground">{firstPage?.totalYears ?? sortedYears.length}</p>
              <p className="text-caption">Years</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-5 flex-wrap">
          <Link to={`/create?for=${id}`}>
            <Button className="rounded-xl gap-2" size="sm">
              <Plus className="w-4 h-4" /> Add Memory
            </Button>
          </Link>
          {memories.length > 0 && (
            <Link to={`/story/${id}`}>
              <Button variant="secondary" size="sm" className="rounded-xl gap-2">
                <BookOpen className="w-3.5 h-3.5" /> View Story
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Profile
          </Button>
          {memories.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => setShowTemplatePicker(true)}
              disabled={pdfLoading}
            >
              <Download className="w-3.5 h-3.5" />
              {pdfLoading ? 'Creating…' : 'Download Story'}
            </Button>
          )}
          </div>
        </KeepsakeCard>

      <Tabs defaultValue="all" onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="w-full bg-secondary/50 rounded-xl h-10">
          <TabsTrigger value="all" className="rounded-lg text-caption flex-1">All ({memories.length})</TabsTrigger>
          <TabsTrigger value="text" className="rounded-lg text-caption flex-1">
            <FileText className="w-3 h-3 mr-1" />{typeCounts.text}
          </TabsTrigger>
          <TabsTrigger value="photo" className="rounded-lg text-caption flex-1">
            <Image className="w-3 h-3 mr-1" />{typeCounts.photo}
          </TabsTrigger>
          <TabsTrigger value="voice" className="rounded-lg text-caption flex-1">
            <Mic className="w-3 h-3 mr-1" />{typeCounts.voice}
          </TabsTrigger>
          <TabsTrigger value="video" className="rounded-lg text-caption flex-1">
            <Video className="w-3 h-3 mr-1" />{typeCounts.video}
          </TabsTrigger>
        </TabsList>

        {['all', 'text', 'photo', 'voice', 'video'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-6">
            {sortedYears.map(year => {
              const yearMemories = memoryGroups[year].filter(m => tab === 'all' || m.memory_type === tab);
              if (yearMemories.length === 0) return null;
              return (
                <div key={year}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="text-section-title">{year}</h3>
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-caption">{yearMemories.length}</span>
                  </div>
                  <div className="space-y-3">
                    {yearMemories.map((memory, i) => (
                      <MemoryCard key={memory.id} memory={memory} index={i} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="h-4" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            )}

            {memories.length === 0 && !isLoadingMemories && (
              <EmptyState
                prompt="What made you smile today?"
                subtitle={`Start preserving moments for ${person.name}.`}
                illustration={<Heart className="w-8 h-8 text-primary/50" />}
                action={
                  <Link to={`/create?for=${id}`}>
                    <Button className="rounded-xl gap-2">
                      <Plus className="w-4 h-4" /> Add memory
                    </Button>
                  </Link>
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
      </motion.div>

      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        person={person}
      />

      <TemplatePickerDialog
        open={showTemplatePicker}
        onOpenChange={setShowTemplatePicker}
        onGenerate={handleDownloadPDF}
        isGenerating={pdfLoading}
      />
    </div>
  );
}