import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, User } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import SafeImage from '@/components/shared/SafeImage';
import SectionHeader from '@/components/shared/SectionHeader';

export default function LovedOneCircles({ lovedOnes = [] }) {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 5);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkArrows();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkArrows);
      return () => el.removeEventListener('scroll', checkArrows);
    }
  }, [lovedOnes]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <SectionHeader title="Your People" actionLabel="See all" actionTo="/loved-ones" />

      {lovedOnes.length === 0 && (
        <p className="text-caption mb-4 -mt-1">
          Add someone special to begin your story.
        </p>
      )}

      <div className="relative group/carousel">
        {showLeftArrow && lovedOnes.length > 0 && (
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/95 shadow-md border border-border/60 flex items-center justify-center md:opacity-0 md:group-hover/carousel:opacity-100 opacity-70 transition-opacity"
          >
            <svg className="w-3.5 h-3.5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth pb-1 pt-1"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
        >
          <div className="flex gap-3 w-max pl-0.5">
            {lovedOnes.map((person) => (
              <Link
                key={person.id}
                to={`/profile/${person.id}`}
                className="flex flex-col items-center gap-1.5 min-w-[68px] group"
              >
                <div className="relative">
                  <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-br from-primary/90 via-primary/60 to-accent/80 group-hover:scale-105 transition-transform duration-300 ring-glow">
                    <div className="w-full h-full rounded-full border-2 border-card bg-secondary overflow-hidden flex items-center justify-center">
                      <SafeImage
                        src={person.photo_url}
                        alt={person.name}
                        className="w-full h-full object-cover"
                        fallback={<User className="w-6 h-6 text-muted-foreground" />}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-caption font-medium text-foreground text-center leading-tight truncate w-[68px]">
                  {person.name}
                </span>
              </Link>
            ))}

            <Link to="/loved-ones/new" className="flex flex-col items-center gap-1.5 min-w-[68px] group">
              <div className="w-[68px] h-[68px] rounded-full border-2 border-dashed border-primary/25 flex items-center justify-center hover:border-primary/45 hover:bg-primary/5 transition-all duration-300 group-active:scale-95">
                <Plus className="w-6 h-6 text-primary/45 group-hover:text-primary/70 transition-colors" />
              </div>
              <span className="text-caption font-medium">Add</span>
            </Link>
          </div>
        </div>

        {showRightArrow && lovedOnes.length > 0 && (
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/95 shadow-md border border-border/60 flex items-center justify-center md:opacity-0 md:group-hover/carousel:opacity-100 opacity-70 transition-opacity"
          >
            <svg className="w-3.5 h-3.5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </motion.section>
  );
}
