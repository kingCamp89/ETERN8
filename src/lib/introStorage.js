const INTRO_KEY = 'hasSeenIntro';

export function hasSeenIntro() {
  try {
    return localStorage.getItem(INTRO_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_KEY, 'true');
  } catch {}
}
