/** Shared semantic tokens — every theme merges on top of this */
const BASE_THEME_VARS = {
  '--primary': '32 58% 52%',
  '--primary-foreground': '0 0% 100%',
  '--background': '30 33% 97%',
  '--foreground': '28 20% 16%',
  '--card': '0 0% 100%',
  '--card-foreground': '28 20% 16%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '28 20% 16%',
  '--accent': '34 48% 72%',
  '--accent-foreground': '28 35% 22%',
  '--secondary': '32 38% 90%',
  '--secondary-foreground': '28 20% 16%',
  '--muted': '32 20% 94%',
  '--muted-foreground': '28 12% 42%',
  '--destructive': '0 57% 63%',
  '--destructive-foreground': '0 0% 100%',
  '--border': '32 15% 88%',
  '--input': '32 15% 88%',
  '--ring': '32 58% 52%',
  '--gradient-btn-start': '#E8C89A',
  '--gradient-btn-mid': '#C28945',
  '--gradient-btn-end': '#A87238',
  '--btn-shadow-rgb': '168, 114, 56',
};

export const APP_THEMES = [
  {
    id: 'warm',
    name: 'Warm Gold',
    description: 'Timeless & elegant',
    emoji: '🌼',
    vars: {
      '--warm-gold': '32 58% 52%',
      '--gold-light': '34 48% 72%',
      '--gold-wash': '32 38% 90%',
      '--gold-glow': '38 62% 88%',
      '--warm-rose': '32 58% 52%',
      '--warm-lavender': '34 48% 72%',
      '--warm-sage': '134 18% 52%',
      '--warm-sky': '32 38% 70%',
      '--warm-coral': '34 48% 72%',
    },
    ambience: {
      deep: '28 35% 22%',
      mid: '32 45% 38%',
      accent: '32 58% 52%',
      light: '38 55% 78%',
      glow: '38 62% 88%',
      ridge: '#9A6B35',
    },
    preview: { bg: '#FBF8F5', accent: '#C28945', text: '#2E2428' },
  },
  {
    id: 'blush',
    name: 'Blush Rose',
    description: 'Soft & tender',
    emoji: '🌸',
    vars: {
      '--primary': '340 55% 55%',
      '--primary-foreground': '340 100% 98%',
      '--background': '340 30% 97%',
      '--foreground': '340 20% 15%',
      '--card': '340 25% 99%',
      '--card-foreground': '340 20% 15%',
      '--popover': '340 25% 99%',
      '--popover-foreground': '340 20% 15%',
      '--accent': '340 40% 92%',
      '--accent-foreground': '340 20% 20%',
      '--secondary': '340 20% 93%',
      '--secondary-foreground': '340 15% 25%',
      '--muted': '340 15% 94%',
      '--muted-foreground': '340 8% 45%',
      '--border': '340 20% 88%',
      '--input': '340 20% 88%',
      '--ring': '340 55% 55%',
      '--gradient-btn-start': '#F6C4B5',
      '--gradient-btn-mid': '#E99593',
      '--gradient-btn-end': '#D66D88',
      '--btn-shadow-rgb': '214, 109, 136',
      '--warm-gold': '340 55% 55%',
      '--warm-rose': '340 55% 55%',
      '--warm-lavender': '340 40% 75%',
      '--warm-sage': '340 30% 65%',
      '--warm-sky': '340 35% 72%',
      '--warm-coral': '340 48% 68%',
    },
    ambience: {
      deep: '340 28% 20%',
      mid: '340 55% 55%',
      accent: '340 48% 65%',
      light: '340 32% 88%',
      glow: '340 45% 92%',
      ridge: '#8A3050',
    },
    preview: { bg: '#FDF0F4', accent: '#C04070', text: '#2A1020' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Elegant & dark',
    emoji: '🌙',
    vars: {
      '--primary': '220 75% 65%',
      '--primary-foreground': '220 100% 98%',
      '--background': '220 22% 9%',
      '--foreground': '220 20% 96%',
      '--card': '220 18% 15%',
      '--card-foreground': '220 18% 96%',
      '--popover': '220 18% 15%',
      '--popover-foreground': '220 18% 96%',
      '--accent': '220 18% 22%',
      '--accent-foreground': '220 15% 92%',
      '--secondary': '220 14% 19%',
      '--secondary-foreground': '220 15% 90%',
      '--muted': '220 14% 17%',
      '--muted-foreground': '220 14% 74%',
      '--border': '220 12% 28%',
      '--input': '220 12% 24%',
      '--ring': '220 75% 65%',
      '--gradient-btn-start': '#8EB4F7',
      '--gradient-btn-mid': '#5B8AEF',
      '--gradient-btn-end': '#3D6BD4',
      '--btn-shadow-rgb': '61, 107, 212',
      '--warm-gold': '220 75% 65%',
      '--warm-rose': '220 75% 65%',
      '--warm-lavender': '220 55% 72%',
      '--warm-sage': '220 45% 58%',
      '--warm-sky': '220 70% 68%',
      '--warm-coral': '220 60% 70%',
    },
    ambience: {
      deep: '220 28% 8%',
      mid: '220 35% 22%',
      accent: '220 70% 60%',
      light: '220 45% 42%',
      glow: '220 55% 55%',
      ridge: '#1E3A6E',
    },
    preview: { bg: '#141824', accent: '#5B8AEF', text: '#E8ECF5' },
  },
  {
    id: 'sage',
    name: 'Sage Garden',
    description: 'Calm & neutral',
    emoji: '🌿',
    vars: {
      '--primary': '150 35% 42%',
      '--primary-foreground': '150 60% 97%',
      '--background': '150 15% 97%',
      '--foreground': '150 20% 15%',
      '--card': '150 12% 99%',
      '--card-foreground': '150 20% 15%',
      '--popover': '150 12% 99%',
      '--popover-foreground': '150 20% 15%',
      '--accent': '150 30% 90%',
      '--accent-foreground': '150 20% 20%',
      '--secondary': '150 15% 93%',
      '--secondary-foreground': '150 15% 25%',
      '--muted': '150 10% 94%',
      '--muted-foreground': '150 8% 45%',
      '--border': '150 12% 88%',
      '--input': '150 12% 88%',
      '--ring': '150 35% 42%',
      '--gradient-btn-start': '#B5D4BE',
      '--gradient-btn-mid': '#4A8C65',
      '--gradient-btn-end': '#3D7354',
      '--btn-shadow-rgb': '61, 115, 84',
      '--warm-gold': '150 35% 42%',
      '--warm-rose': '150 35% 42%',
      '--warm-lavender': '150 25% 55%',
      '--warm-sage': '150 35% 42%',
      '--warm-sky': '150 30% 50%',
      '--warm-coral': '150 28% 48%',
    },
    ambience: {
      deep: '150 25% 18%',
      mid: '150 30% 32%',
      accent: '150 35% 42%',
      light: '150 22% 78%',
      glow: '150 35% 88%',
      ridge: '#3D6B52',
    },
    preview: { bg: '#F0F7F2', accent: '#4A8C65', text: '#142018' },
  },
];

export const DEFAULT_THEME_KEY = 'fm_global_theme';

export function getGlobalTheme() {
  return localStorage.getItem(DEFAULT_THEME_KEY) || 'warm';
}

export function setGlobalTheme(id) {
  localStorage.setItem(DEFAULT_THEME_KEY, id);
}

export function applyTheme(themeId) {
  const theme = APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];
  const root = document.documentElement;
  const merged = { ...BASE_THEME_VARS, ...theme.vars };

  Object.entries(merged).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  if (theme.ambience) {
    Object.entries(theme.ambience).forEach(([key, value]) => {
      root.style.setProperty(`--ambience-${key}`, value);
    });
  }

  root.setAttribute('data-theme', theme.id);
  root.classList.toggle('dark', themeId === 'midnight');
  root.style.colorScheme = themeId === 'midnight' ? 'dark' : 'light';
}

if (typeof window !== 'undefined') {
  // Apply saved theme immediately on module load (keeps theme across page refreshes)
  applyTheme(getGlobalTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyTheme(getGlobalTheme());
  });
}
