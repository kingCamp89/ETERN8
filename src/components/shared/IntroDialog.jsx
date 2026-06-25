import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Play, Pause, Sparkles, Clock, Users, ArrowRight, Heart, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const scenes = [
  {
    videoUrl: 'https://media.base44.com/videos/public/6a2b2ffd9f4e986100520d9a/d3e644d8c_generated_video.mp4',
    title: 'Every Moment Matters',
    subtitle: 'The little things — a first laugh, a proud milestone, a quiet "I love you" — deserve to be treasured forever.',
    icon: Sparkles,
    color: 'from-primary/35 via-primary/15 to-transparent',
  },
  {
    videoUrl: 'https://media.base44.com/videos/public/6a2b2ffd9f4e986100520d9a/276b72122_generated_video.mp4',
    title: 'A Bridge Through Time',
    subtitle: 'Your words travel across the years. A note written today can reach your child on their 18th birthday, or your partner on your anniversary. Timeless love, delivered when it matters most.',
    icon: Clock,
    color: 'from-secondary/40 via-primary/20 to-transparent',
  },
  {
    videoUrl: 'https://media.base44.com/videos/public/6a2b2ffd9f4e986100520d9a/d24fea335_generated_video.mp4',
    title: 'Only The People Who Matter',
    subtitle: 'No algorithms. No negativity. Just you and the people you truly love, sharing joy, pride, and gratitude in a space built for connection.',
    icon: Users,
    color: 'from-primary/30 via-secondary/25 to-transparent',
  },
];

const features = [
  { icon: Heart, text: 'Capture fleeting feelings before they fade' },
  { icon: Clock, text: 'Schedule messages for future milestones' },
  { icon: Shield, text: 'Legacy delivery ensures your love lives on' },
  { icon: Users, text: 'Share only with your inner circle' },
];

export default function IntroDialog({ open, onClose }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef(null);

  const goNext = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(prev => prev + 1);
      setVideoEnded(false);
      setVideoPlaying(true);
    } else {
      onClose();
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoPlaying) {
      videoRef.current.pause();
      setVideoPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setVideoPlaying(true);
    }
  };

  useEffect(() => {
    setVideoEnded(false);
    setVideoPlaying(true);
  }, [currentScene]);

  useEffect(() => {
    if (open) {
      setCurrentScene(0);
      setVideoEnded(false);
      setVideoPlaying(true);
    }
  }, [open]);

  if (!open) return null;

  const scene = scenes[currentScene];
  const isLast = currentScene === scenes.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0706] overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Video background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <video
            ref={videoRef}
            src={scene.videoUrl}
            autoPlay
            muted
            playsInline
            loop={false}
            onEnded={() => { setVideoEnded(true); setVideoPlaying(false); }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-b ${scene.color} to-black/90`} />
          <div className="absolute inset-0 bg-black/15" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end z-10">
        <div className="px-6 pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <scene.icon className="w-6 h-6 text-white" />
              </div>

              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
                {scene.title}
              </h1>

              <p className="text-base sm:text-lg text-white/95 leading-relaxed max-w-md drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                {scene.subtitle}
              </p>

              {isLast && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-2 gap-3 pt-2"
                >
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <f.icon className="w-4 h-4 text-white/80 mt-0.5 flex-shrink-0" />
                      <span className="text-caption text-white/85">{f.text}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
                >
                  {videoPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  )}
                </button>

                <div className="flex gap-1.5">
                  {scenes.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === currentScene ? 'w-6 bg-white' : 'w-1.5 bg-white/30'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex-1" />

                <Button
                  onClick={goNext}
                  className="rounded-xl gap-2 shadow-lg"
                  size="lg"
                >
                  {isLast ? (
                    <>Done <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Next <ChevronRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}