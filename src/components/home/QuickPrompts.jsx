import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BrandPen, BrandMic, BrandCamera, BrandVideo } from '@/components/shared/BrandIcons';
import SectionHeader from '@/components/shared/SectionHeader';
import KeepsakeCard from '@/components/shared/KeepsakeCard';

const prompts = [
  {
    icon: BrandPen,
    type: 'text',
    prompt: 'What made you smile today?',
    gradient: 'from-primary/12 to-primary/5',
  },
  {
    icon: BrandMic,
    type: 'voice',
    prompt: 'Record a message',
    gradient: 'from-secondary/80 to-primary/5',
  },
  {
    icon: BrandCamera,
    type: 'photo',
    prompt: 'Capture a photo',
    gradient: 'from-primary/10 to-secondary/40',
  },
  {
    icon: BrandVideo,
    type: 'video',
    prompt: 'Record a video',
    gradient: 'from-secondary/60 to-primary/8',
  },
];

export default function QuickPrompts() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="pt-2"
    >
      <SectionHeader
        title="Ideas to inspire you"
        subtitle="Gentle prompts when you're ready to explore"
      />
      <div className="grid grid-cols-2 gap-2.5">
        {prompts.map((p) => {
          const Icon = p.icon;
          return (
            <Link key={p.type} to={`/create?type=${p.type}`} className="block">
              <KeepsakeCard
                interactive
                padding={false}
                className={`bg-gradient-to-br ${p.gradient} p-3.5 border-border/25`}
              >
                <Icon className="w-4 h-4 mb-2 opacity-70" />
                <p className="text-menu-title">{p.prompt}</p>
              </KeepsakeCard>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
