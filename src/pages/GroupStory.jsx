import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Calendar, Heart, Image, Mic, Play, Pause, Users } from 'lucide-react';
import SafeImage from '@/components/shared/SafeImage';

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

function StoryMemoryCard({ memory, theme, index, group, currentUser }) {
  const isEven = index % 2 === 0;
  const bg = emotionPalettes[memory.emotion] || 'from-card to-card';
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  const creatorIndex = group?.member_ids?.indexOf(memory.created_by_id);
  const creatorName = creatorIndex >= 0 ? group?.member_names?.[creatorIndex] : null;
  const isOwn = memory.created_by_id === currentUser?.id;
  const creatorPhoto = creatorIndex >= 0 ? group?.member_photos?.[creatorIndex] : null;
  const avatarPhoto = memory.loved_one_photo_url || (isOwn ? currentUser?.photo_url : creatorPhoto);
  const displayName = memory.loved_one_name || (isOwn ? 'You' : (creatorName || 'A member'));

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
                      <div key={i} className="w-1 bg-primary/30 rounded-full"
                        style={{ height: `${Math.random() * 24 + 4}px`, opacity: audioPlaying ? 0.8 : 0.4 }} />
                    ))}
                  </div>
                </div>
              </div>
              <audio ref={audioRef} src={memory.media_url} onEnded={() => setAudioPlaying(false)} className="hidden" />
            </div>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden flex-shrink-0">
              <SafeImage src={avatarPhoto} alt="" className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary/50">{displayName.charAt(0).toUpperCase()}</div>} />
            </div>
            <span className="text-caption font-medium text-foreground">
              {displayName}
              {memory.loved_one_name && ` · ${isOwn ? 'you' : (creatorName || 'a member')}`}
            </span>
          </div>

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
        </div>
      </KeepsakeCard>
    </div>
  );
}

function YearChapter({ year, memories, theme, group, currentUser }) {
  return (
    <div className="mb-12">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-6 pl-8">
          <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center`}>
            <span className={`text-caption font-bold ${theme.accent}`}>{year}</span>
          </div>
          <div className={`flex-1 h-px ${theme.line}`} />
          <span className="text-caption text-muted-foreground">{memories.length} {memories.length === 1 ? 'memory' : 'memories'}</span>
        </div>
      </ScrollReveal>

      <div className="relative pl-8">
        <div className={`absolute left-[5px] top-0 bottom-0 w-[2px] ${theme.line}`} />
        <div className="space-y-10">
          {memories.map((memory, i) => (
            <ScrollReveal key={memory.id}>
              <StoryMemoryCard memory={memory} theme={theme} index={i} group={group} currentUser={currentUser} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GroupStory() {
  const { id } = useParams();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: groupData, isLoading: groupLoading, isError: groupDetailError } = useQuery({
    queryKey: ['groupDetail', id],
    queryFn: () => base44.functions.invoke('getGroupDetail', { groupId: id }),
    enabled: !!id,
  });
  const group = groupData?.data?.group;

  const { data: memoriesData, isLoading: memoriesLoading } = useQuery({
    queryKey: ['groupMemories', id],
    queryFn: () => base44.functions.invoke('getGroupMemories', { groupId: id }),
    enabled: !!group,
  });
  const sharedMemories = memoriesData?.data?.memories || [];

  if (groupLoading || memoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (groupDetailError || !group) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Circle story" showBack />
        <EmptyState
          prompt={groupDetailError ? 'Access denied' : 'Circle not found'}
          subtitle={groupDetailError
            ? "You're not a member of this circle yet. Ask a member to add you."
            : "This circle may have been deleted or you don't have permission to view it."}
          illustration={<Heart className="w-8 h-8 text-destructive/50" />}
        />
      </div>
    );
  }

  const theme = themeColors[group.cover_color] || themeColors.rose;
  const isMember = group.member_ids?.includes(user?.id) || group.created_by_id === user?.id;

  const yearGroups = sharedMemories.reduce((acc, memory) => {
    const year = memory.memory_date
      ? new Date(memory.memory_date).getFullYear()
      : new Date(memory.created_date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(memory);
    return acc;
  }, {});

  const sortedYears = Object.keys(yearGroups).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="min-h-screen">
      <PageHeader title="Circle story" subtitle={group.name} showBack />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center pb-8 pt-2 page-sections"
      >
        <div className="w-20 h-20 rounded-full bg-secondary border-2 border-primary/20 overflow-hidden flex items-center justify-center mx-auto mb-4">
          {group.group_photo_url ? (
            <img src={group.group_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Users className="w-8 h-8 text-primary/40" />
          )}
        </div>
        <h1 className="text-section-title text-2xl sm:text-3xl">
          {group.name}
        </h1>
        <p className="text-caption mt-1">
          {sharedMemories.length} {sharedMemories.length === 1 ? 'shared memory' : 'shared memories'} from {group.member_names?.length || 0} {group.member_names?.length === 1 ? 'member' : 'members'}
        </p>
      </motion.div>

      <div className="page-sections pb-20">
        {!isMember ? (
          <EmptyState
            prompt="Join to view the story"
            subtitle="Once you're a member, the shared timeline will appear here."
            illustration={<Heart className="w-8 h-8 text-primary/50" />}
          />
        ) : sortedYears.length > 0 ? (
          sortedYears.map(year => (
            <YearChapter key={year} year={year} memories={yearGroups[year]} theme={theme} group={group} currentUser={user} />
          ))
        ) : (
          <EmptyState
            prompt="The story is just beginning"
            subtitle="Start sharing memories with this circle to build the timeline."
            illustration={<Heart className="w-8 h-8 text-primary/50" />}
          />
        )}
      </div>
    </div>
  );
}
