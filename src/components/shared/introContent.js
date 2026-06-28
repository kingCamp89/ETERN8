import { Sparkles, Clock, Users, Heart, Shield } from 'lucide-react';

/**
 * Intro visuals — Unsplash + Pexels (free for commercial use).
 * Welcome: family walking together · Capture: Esra Korkmaz · Deliver: grandfather & child · Connect: family at the beach
 */
export const INTRO_SCENES = [
  {
    id: 'welcome',
    type: 'welcome',
    title: 'Your story starts here',
    subtitle: 'Preserve love, milestones, and the words that matter most — for the people you cherish.',
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1920&q=85',
    imageAlt: 'A family holding hands while walking together at golden hour',
    gradient: 'from-[#2a1520]/90 via-[#1a1018]/80 to-[#0a0706]',
  },
  {
    id: 'moments',
    type: 'image',
    stepLabel: 'Capture',
    imageUrl: 'https://images.pexels.com/photos/17951094/pexels-photo-17951094.jpeg?auto=compress&cs=tinysrgb&w=1920',
    imageAlt: 'Polaroid photographs clipped to warm string lights',
    title: 'Every moment matters',
    subtitle: 'The first laugh, a proud milestone, a quiet "I love you" — the little things deserve to be treasured forever.',
    icon: Sparkles,
    gradient: 'from-primary/40 via-[#1a1018]/80 to-[#0a0706]',
  },
  {
    id: 'time',
    type: 'image',
    stepLabel: 'Deliver',
    imageUrl: 'https://images.unsplash.com/photo-1758612897150-210b2a72b275?auto=format&fit=crop&w=1920&q=85',
    imageAlt: 'A grandfather reading a book with his grandson on the sofa',
    title: 'A bridge through time',
    subtitle: 'Write today for tomorrow. A note can reach your child on their 18th birthday, or your partner on your anniversary.',
    icon: Clock,
    gradient: 'from-secondary/35 via-[#1a1018]/80 to-[#0a0706]',
  },
  {
    id: 'circle',
    type: 'image',
    stepLabel: 'Connect',
    imageUrl: 'https://images.pexels.com/photos/861308/pexels-photo-861308.jpeg?auto=compress&cs=tinysrgb&w=1920',
    imageAlt: 'A family walking together along the shoreline at sunset',
    title: 'Only the people who matter',
    subtitle: 'No algorithms. No noise. Just you and your inner circle — sharing joy, pride, and gratitude in a space built for connection.',
    icon: Users,
    gradient: 'from-primary/30 via-secondary/20 to-[#0a0706]',
  },
];

export const INTRO_FEATURES = [
  { icon: Heart, text: 'Capture feelings before they fade' },
  { icon: Clock, text: 'Schedule messages for milestones' },
  { icon: Shield, text: 'Legacy delivery when it matters most' },
  { icon: Users, text: 'Share only with your inner circle' },
];
