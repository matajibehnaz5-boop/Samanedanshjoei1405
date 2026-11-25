export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'app-theme';

export function getSavedTheme(): ThemeMode {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'dark';
    }
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('theme-dark', 'dark');
    root.classList.add('theme-light');
    root.style.colorScheme = 'light';
    root.dataset.theme = 'light';
  } else {
    root.classList.remove('theme-light', 'light');
    root.classList.add('theme-dark');
    root.style.colorScheme = 'dark';
    root.dataset.theme = 'dark';
  }
}

export function saveTheme(theme: ThemeMode): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage quota or security errors
  }
}
