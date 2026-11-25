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
  root.classList.remove('theme-dark', 'theme-light', 'dark', 'light');
  root.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  root.style.colorScheme = theme;
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
