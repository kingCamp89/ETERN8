import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, ArrowRight, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/Logo';
import BrandWordmark from '@/components/shared/BrandWordmark';
import { INTRO_SCENES, INTRO_FEATURES } from '@/components/shared/introContent';

const SWIPE_THRESHOLD = 60;

function SceneBackground({ scene, animate, ready, onReady }) {
  const prefersReducedMotion = useReducedMotion();
  const hasImage = Boolean(scene.imageUrl);

  if (!hasImage) {
    return <div className={`absolute inset-0 bg-gradient-to-b ${scene.gradient}`} />;
  }

  return (
    <>
      {!ready && (
        <div className={`absolute inset-0 bg-gradient-to-b ${scene.gradient}`} />
      )}
      <motion.img
        key={scene.imageUrl}
        src={scene.imageUrl}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        onLoad={onReady}
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.06 }}
        animate={{
          opacity: ready ? 1 : 0,
          scale: prefersReducedMotion ? 1 : animate ? 1.1 : 1.06,
        }}
        transition={{
          opacity: { duration: 0.7 },
          scale: { duration: 18, ease: 'linear' },
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </>
  );
}

export default function IntroExperience({
  mode = 'page',
  onComplete,
  onDismiss,
  completeLabel = 'Begin your story',
  dismissLabel = 'Skip',
}) {
  const prefersReducedMotion = useReducedMotion();
  const [currentScene, setCurrentScene] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);

  const scene = INTRO_SCENES[currentScene];
  const isFirst = currentScene === 0;
  const isLast = currentScene === INTRO_SCENES.length - 1;
  const isWelcome = scene.type === 'welcome';

  const resetMediaState = useCallback(() => {
    setMediaReady(false);
  }, []);

  const goToScene = useCallback((index) => {
    if (index < 0 || index >= INTRO_SCENES.length) return;
    setCurrentScene(index);
    resetMediaState();
  }, [resetMediaState]);

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete?.();
    } else {
      goToScene(currentScene + 1);
    }
  }, [currentScene, goToScene, isLast, onComplete]);

  const goPrev = useCallback(() => {
    if (!isFirst) goToScene(currentScene - 1);
  }, [currentScene, goToScene, isFirst]);

  useEffect(() => {
    resetMediaState();
  }, [currentScene, resetMediaState]);

  useEffect(() => {
    if (!scene.imageUrl) setMediaReady(true);
  }, [scene.imageUrl]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onDismiss]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goNext();
    else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
  };

  const dismissControl = mode === 'dialog' ? (
    <button
      type="button"
      onClick={onDismiss}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
      aria-label="Close intro"
    >
      <X className="h-5 w-5 text-white" />
    </button>
  ) : (
    <button
      type="button"
      onClick={onDismiss}
      className="rounded-lg px-3 py-1.5 text-caption font-medium text-white/75 transition-colors hover:text-white"
    >
      {dismissLabel}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#0a0706]">
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="absolute inset-0"
        >
          <SceneBackground
            scene={scene}
            animate={mediaReady && !prefersReducedMotion}
            ready={mediaReady}
            onReady={() => setMediaReady(true)}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/90" />
          <div className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black/95 via-black/75 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <header
        className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pb-2"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo size="sm" className="shrink-0 drop-shadow-lg" />
          {!isWelcome && (
            <span className="truncate text-overline text-white/60">
              {scene.stepLabel}
            </span>
          )}
        </div>
        {dismissControl}
      </header>

      {isWelcome && (
        <div
          className="absolute inset-x-0 z-10 flex flex-col items-center px-6 text-center"
          style={{ top: 'max(28%, 9rem)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Logo size="xl" className="mx-auto mb-5 drop-shadow-2xl" />
            <BrandWordmark as="p" size="hero" className="justify-center text-white drop-shadow-lg" />
          </motion.div>
        </div>
      )}

      <div
        className="absolute inset-x-0 bottom-0 z-10"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <motion.div
          key={scene.id}
          drag={prefersReducedMotion ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
          className="mx-auto w-full max-w-lg px-6"
        >
          <div className="space-y-4">
            {!isWelcome && scene.icon && (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm">
                <scene.icon className="h-5 w-5 text-white" />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-overline text-white/50">
                {currentScene + 1} of {INTRO_SCENES.length}
              </p>
              <h1 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
                {scene.title}
              </h1>
              <p className="max-w-md text-body leading-relaxed text-white/90 sm:text-lg">
                {scene.subtitle}
              </p>
            </div>

            {isLast && (
              <motion.ul
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid gap-2 pt-1 sm:grid-cols-2"
              >
                {INTRO_FEATURES.map((feature) => (
                  <li
                    key={feature.text}
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
                  >
                    <feature.icon className="h-4 w-4 shrink-0 text-[#E89A9A]" aria-hidden="true" />
                    <span className="text-caption text-white/85">{feature.text}</span>
                  </li>
                ))}
              </motion.ul>
            )}

            <div className="flex justify-center gap-2 pt-1" role="tablist" aria-label="Intro progress">
              {INTRO_SCENES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === currentScene}
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  onClick={() => goToScene(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentScene ? 'w-7 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              {!isFirst && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                  aria-label="Previous scene"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
              )}

              <div className="flex-1" />

              <Button
                onClick={goNext}
                size="lg"
                className="min-w-[8.5rem] gap-2 rounded-xl shadow-lg"
              >
                {isLast ? (
                  <>{completeLabel} <ArrowRight className="h-4 w-4" /></>
                ) : isWelcome ? (
                  <>Let's begin <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <>Continue <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>

            {!prefersReducedMotion && !isWelcome && (
              <p className="text-center text-caption text-white/40">
                Swipe left or right to navigate
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
