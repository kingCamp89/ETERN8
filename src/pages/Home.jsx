import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import useLovedOnes from '../hooks/useLovedOnes';
import WelcomeHeader from '../components/home/WelcomeHeader';
import LovedOneCircles from '../components/home/LovedOneCircles';
import QuickPrompts from '../components/home/QuickPrompts';
import MemoryReflection from '../components/home/MemoryReflection';
import MemoryCard from '../components/shared/MemoryCard';
import EmptyState from '../components/shared/EmptyState';
import TodaysDeliveries from '../components/home/TodaysDeliveries';
import UpcomingDeliveries from '../components/home/UpcomingDeliveries';
import QuickNote from '../components/home/QuickNote';
import OnThisDay from '../components/home/OnThisDay';
import PendingSharesBanner from '../components/home/PendingSharesBanner';
import HomeSkeleton from '../components/home/HomeSkeleton';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import SectionHeader from '../components/shared/SectionHeader';
import { motion } from 'framer-motion';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { springs } from '@/lib/designTokens';

const sectionMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: springs.gentle.ease },
};

export default function Home() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.legacy_enabled) {
      base44.functions.invoke('checkIn').catch(() => {});
    }
  }, [user?.id]);

  const { data: lovedOnes = [], isLoading: lovedOnesLoading } = useLovedOnes();

  const { data: memories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id }, '-created_date', 20);
    },
  });

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['lovedOnes'] });
    await queryClient.invalidateQueries({ queryKey: ['memories'] });
  }, [queryClient]);

  const { indicatorRef } = usePullToRefresh(handleRefresh);

  const isInitialLoading = lovedOnesLoading && memoriesLoading;
  const recentMemories = memories.slice(0, 6);
  const reflectionMemory = memories.length > 3
    ? memories[Math.floor(Math.random() * Math.min(memories.length, 10))]
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

      <div className="page-sections">
        <WelcomeHeader />

        {isInitialLoading ? (
          <HomeSkeleton />
        ) : (
          <>
            <LovedOneCircles lovedOnes={lovedOnes} />

            <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: springs.stagger * 0.5 }}>
              <PendingSharesBanner />
            </motion.div>

            <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: springs.stagger }}>
              <QuickNote />
            </motion.div>

            <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: springs.stagger * 2 }}>
              <Link to="/create" className="block">
                <Button size="lg" className="w-full gap-2 shadow-md">
                  <Sparkles className="w-4 h-4" />
                  Capture a moment
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="space-y-3"
              {...sectionMotion}
              transition={{ ...sectionMotion.transition, delay: springs.stagger * 3 }}
            >
              <UpcomingDeliveries />
              <TodaysDeliveries />
            </motion.div>

            <motion.div {...sectionMotion} transition={{ ...sectionMotion.transition, delay: springs.stagger * 4 }}>
              <OnThisDay />
            </motion.div>

            {(recentMemories.length > 0 || memories.length === 0) && (
              <motion.section
                {...sectionMotion}
                transition={{ ...sectionMotion.transition, delay: springs.stagger * 5 }}
              >
                {recentMemories.length > 0 && (
                  <>
                    <SectionHeader title="Recent memories" />
                    {reflectionMemory && <MemoryReflection memory={reflectionMemory} />}
                    <div className="space-y-3 mt-3">
                      {recentMemories.map((memory, i) => (
                        <MemoryCard key={memory.id} memory={memory} index={i} />
                      ))}
                    </div>
                  </>
                )}

                {memories.length === 0 && (
                  <EmptyState
                    prompt="What do you hope your children remember?"
                    subtitle="Begin by adding someone special, then capture your first memory."
                    action={
                      <Link to="/loved-ones/new">
                        <Button variant="outline" className="rounded-xl">
                          Add someone special
                        </Button>
                      </Link>
                    }
                  />
                )}
              </motion.section>
            )}

            <QuickPrompts />
          </>
        )}
      </div>
    </div>
  );
}
