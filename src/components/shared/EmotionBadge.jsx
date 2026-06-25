import { Heart, Star, Smile, HandHeart, Clock, Sparkles, Trophy, Brain, Mountain, Laugh } from 'lucide-react';

const emotionConfig = {
  love: { icon: Heart, color: 'bg-primary/15 text-primary', label: 'Love' },
  pride: { icon: Star, color: 'bg-primary/12 text-primary', label: 'Pride' },
  joy: { icon: Smile, color: 'bg-accent/35 text-accent-foreground', label: 'Joy' },
  gratitude: { icon: HandHeart, color: 'bg-secondary text-foreground', label: 'Gratitude' },
  nostalgia: { icon: Clock, color: 'bg-muted text-muted-foreground', label: 'Nostalgia' },
  hope: { icon: Sparkles, color: 'bg-primary/10 text-primary', label: 'Hope' },
  strength: { icon: Mountain, color: 'bg-secondary text-foreground', label: 'Strength' },
  reflection: { icon: Brain, color: 'bg-muted text-muted-foreground', label: 'Reflection' },
  milestone: { icon: Trophy, color: 'bg-primary/15 text-primary', label: 'Milestone' },
  funny: { icon: Laugh, color: 'bg-accent/30 text-accent-foreground', label: 'Funny' },
};

export default function EmotionBadge({ emotion, size = 'sm' }) {
  const config = emotionConfig[emotion];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${config.color} ${
      size === 'sm' ? 'text-caption' : 'text-body'
    }`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}
