/**
 * ETRN8 Design System v1 — single source of truth for brand tokens.
 * CSS variables in index.css are derived from these values.
 */

export const colors = {
  background: '#FBF8F5',
  card: '#FFFFFF',
  textPrimary: '#2E2428',
  textSecondary: '#7F7578',
  rose: '#D56A8A',
  accentGradient: ['#F8C8B6', '#E89A9A', '#D56A8A'],
  buttonGradient: ['#F6C4B5', '#E99593', '#D66D88'],
  goldGradient: ['#F5E8C8', '#DDB98A', '#C28945'],
  warmGold: '#C28945',
  goldLight: '#DDB98A',
  goldWash: '#F3ECE2',
  goldGlow: '#F5E8C8',
  success: '#6F9B79',
  warning: '#D6A25B',
  error: '#D66C6C',
};

export const typography = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'Inter', ui-sans-serif, system-ui, sans-serif",
  brand: "'Cinzel', 'Playfair Display', Georgia, serif",
  emotion: "'Playfair Display', Georgia, serif",
  sectionTitle: { weight: 600, lineHeight: 1.3 },
  bodyText: { weight: 400, lineHeight: 1.65 },
};

/** Semantic text colors — use these instead of ad-hoc grays */
export const textColor = {
  primary: 'text-foreground',
  soft: 'text-foreground/80',
  muted: 'text-muted-foreground',
  accent: 'text-primary',
  danger: 'text-destructive',
};

/**
 * Typography scale — CSS classes in index.css
 * Brand → Cinzel | Heading → Playfair | Emotion → Playfair italic | UI → Inter
 */
export const typeScale = {
  display: { className: 'text-display' },
  pageTitle: { className: 'text-page-title' },
  sectionTitle: { className: 'text-section-title' },
  overline: { className: 'text-overline' },
  body: { className: 'text-body' },
  bodyLg: { className: 'text-body-lg' },
  label: { className: 'text-label' },
  caption: { className: 'text-caption' },
  quote: { className: 'text-quote' },
  quoteLg: { className: 'text-quote-lg' },
  link: { className: 'text-link' },
  menuTitle: { className: 'text-menu-title' },
  menuDesc: { className: 'text-menu-desc' },
  cardTitle: { className: 'text-card-title' },
  stat: { className: 'text-stat' },
};

export const motion = {
  duration: { fast: 200, normal: 300, slow: 350 },
  easing: 'ease-out',
  cardEnter: { y: 8, duration: 300 },
  buttonPress: { scale: 0.98 },
  modalEnter: { y: 12, duration: 300 },
};

export const springs = {
  sheet: { type: 'spring', stiffness: 380, damping: 32 },
  gentle: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  stagger: 0.08,
};

export const depth = {
  card: {
    highlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    shadow: '0 1px 2px rgba(46, 36, 40, 0.04), 0 4px 20px rgba(46, 36, 40, 0.04)',
  },
  floating: {
    shadow: '0 2px 8px rgba(46, 36, 40, 0.06), 0 12px 32px rgba(46, 36, 40, 0.05)',
  },
};

export const button = {
  height: 56,
  borderRadius: 16,
  shadow: '0 4px 16px rgba(214, 109, 136, 0.18)',
};

/** Layout spacing — matches .page-container / .page-sections in index.css */
export const spacing = {
  pageX: 20,
  sectionGap: 24,
  cardPadding: 20,
  pageBottom: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

/** Elevation class names in index.css */
export const elevation = {
  0: '',
  1: 'depth-card',
  2: 'depth-floating',
  keepsake: 'keepsake-card',
};

export const welcomeGreetings = [
  'What moment will you preserve today?',
  'Every memory is a gift to the future.',
  'The smallest moments become the greatest treasures.',
  'Your love story continues, one memory at a time.',
  'Some moments are too precious to let fade.',
  'What would you want them to remember about today?',
  'Love lives in the details — capture one now.',
  'A single memory can comfort someone for years.',
  'The ordinary days are often the ones we miss most.',
  'What made your heart feel full this week?',
  'Preserve the laughter, the warmth, the quiet joy.',
  'Tomorrow will thank you for saving this today.',
];

const WELCOME_GREETING_KEY = 'etrn8_last_welcome_greeting';

/** Picks a greeting at random, avoiding the same line twice in a row per visit session. */
export function getWelcomeGreeting() {
  if (welcomeGreetings.length === 0) return '';
  if (welcomeGreetings.length === 1) return welcomeGreetings[0];

  let last = null;
  try {
    last = sessionStorage.getItem(WELCOME_GREETING_KEY);
  } catch {
    /* private browsing */
  }

  const pool = last
    ? welcomeGreetings.filter((g) => g !== last)
    : welcomeGreetings;

  const picked = pool[Math.floor(Math.random() * pool.length)];

  try {
    sessionStorage.setItem(WELCOME_GREETING_KEY, picked);
  } catch {
    /* ignore */
  }

  return picked;
}

export const emptyStatePrompts = [
  'What made you smile today?',
  'What do you hope your children remember?',
  'What are you grateful for right now?',
  'What moment do you never want to forget?',
  'What would you tell your future self?',
  'What story deserves to be preserved?',
];

export function getRandomPrompt() {
  return emptyStatePrompts[Math.floor(Math.random() * emptyStatePrompts.length)];
}
