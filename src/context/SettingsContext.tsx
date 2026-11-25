import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { applyTheme, getSavedTheme, saveTheme, THEME_STORAGE_KEY, type ThemeMode } from '../theme';
import { api } from '../lib/api';

export interface SystemSettings {
  smsNotify: boolean;
  emailNotify: boolean;
  showOnlineStatus: boolean;
  darkMode: boolean;
  autoSave: boolean;
  isCompactFrame: boolean;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  smsNotify: true,
  emailNotify: false,
  showOnlineStatus: true,
  darkMode: true,
  autoSave: true,
  isCompactFrame: false,
};

interface SettingsContextType {
  settings: SystemSettings;
  savedSettings: SystemSettings;
  userStorageScope: string;
  updatePreviewSettings: (
    updater: Partial<SystemSettings> | ((prev: SystemSettings) => SystemSettings)
  ) => void;
  saveSettings: (nextSettings?: SystemSettings) => void;
  resetToDefaults: () => SystemSettings;
  discardPreview: () => void;
  setUserScope: (scope: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  syncThemeFromServer: (serverTheme: ThemeMode | null | undefined) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_PREFIX = 'app_settings:';
const LAST_SCOPE_STORAGE_KEY = 'app_settings:last_scope';

function getSettingsStorageKey(scope: string): string {
  return `${SETTINGS_STORAGE_PREFIX}${scope || 'guest'}`;
}

function readLastScopeFromStorage(): string {
  try {
    const savedScope = localStorage.getItem(LAST_SCOPE_STORAGE_KEY);
    return savedScope && savedScope.trim() ? savedScope.trim() : 'guest';
  } catch {
    return 'guest';
  }
}

function writeLastScopeToStorage(scope: string): void {
  try {
    localStorage.setItem(LAST_SCOPE_STORAGE_KEY, scope || 'guest');
  } catch {
    // ignore storage errors
  }
}

function sanitizeSettings(raw: unknown): SystemSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SYSTEM_SETTINGS };
  }
  const obj = raw as Record<string, unknown>;
  return {
    smsNotify: typeof obj.smsNotify === 'boolean' ? obj.smsNotify : DEFAULT_SYSTEM_SETTINGS.smsNotify,
    emailNotify: typeof obj.emailNotify === 'boolean' ? obj.emailNotify : DEFAULT_SYSTEM_SETTINGS.emailNotify,
    showOnlineStatus:
      typeof obj.showOnlineStatus === 'boolean'
        ? obj.showOnlineStatus
        : DEFAULT_SYSTEM_SETTINGS.showOnlineStatus,
    darkMode: typeof obj.darkMode === 'boolean' ? obj.darkMode : DEFAULT_SYSTEM_SETTINGS.darkMode,
    autoSave: typeof obj.autoSave === 'boolean' ? obj.autoSave : DEFAULT_SYSTEM_SETTINGS.autoSave,
    isCompactFrame:
      typeof obj.isCompactFrame === 'boolean'
        ? obj.isCompactFrame
        : DEFAULT_SYSTEM_SETTINGS.isCompactFrame,
  };
}

function readSettingsFromStorage(scope: string): SystemSettings {
  const savedThemeDark = getSavedTheme() === 'dark';
  try {
    const raw = localStorage.getItem(getSettingsStorageKey(scope));
    if (!raw) return { ...DEFAULT_SYSTEM_SETTINGS, darkMode: savedThemeDark };
    const sanitized = sanitizeSettings(JSON.parse(raw));
    return { ...sanitized, darkMode: savedThemeDark };
  } catch {
    return { ...DEFAULT_SYSTEM_SETTINGS, darkMode: savedThemeDark };
  }
}

function writeSettingsToStorage(scope: string, settings: SystemSettings): void {
  saveTheme(settings.darkMode ? 'dark' : 'light');
  try {
    localStorage.setItem(getSettingsStorageKey(scope), JSON.stringify(settings));
    localStorage.setItem(LAST_SCOPE_STORAGE_KEY, scope || 'guest');
  } catch {
    // ignore storage quota/security errors
  }
}

export function clearUserDraftsFromStorage(scope: string): void {
  try {
    const draftPrefix = `form_draft:${scope || 'guest'}:`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(draftPrefix)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch {
    // ignore storage errors
  }
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialScope = readLastScopeFromStorage();
  const initialSettings = readSettingsFromStorage(initialScope);

  const [userStorageScope, setUserStorageScope] = useState<string>(initialScope);
  const [savedSettings, setSavedSettings] = useState<SystemSettings>(() => {
    applyTheme(initialSettings.darkMode ? 'dark' : 'light');
    return initialSettings;
  });
  const [previewSettings, setPreviewSettings] = useState<SystemSettings | null>(null);

  const scopeRef = useRef<string>(initialScope);
  const savedSettingsRef = useRef<SystemSettings>(initialSettings);
  const previewSettingsRef = useRef<SystemSettings | null>(null);
  const isAuthenticatedRef = useRef<boolean>(false);

  const settings = previewSettings ?? savedSettings;

  // Keep DOM theme in sync whenever effective darkMode changes
  useEffect(() => {
    applyTheme(settings.darkMode ? 'dark' : 'light');
  }, [settings.darkMode]);

  // Listen for cross-tab localStorage theme/settings updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY || e.key === null) {
        const syncedTheme = getSavedTheme();
        const nextDark = syncedTheme === 'dark';
        applyTheme(syncedTheme);

        const nextSaved = { ...savedSettingsRef.current, darkMode: nextDark };
        savedSettingsRef.current = nextSaved;
        setSavedSettings(nextSaved);

        if (previewSettingsRef.current !== null) {
          const nextPreview = { ...previewSettingsRef.current, darkMode: nextDark };
          previewSettingsRef.current = nextPreview;
          setPreviewSettings(nextPreview);
        }
      } else if (e.key === getSettingsStorageKey(scopeRef.current) && e.newValue) {
        try {
          const parsed = sanitizeSettings(JSON.parse(e.newValue));
          const syncedTheme = getSavedTheme();
          const merged = { ...parsed, darkMode: syncedTheme === 'dark' };
          savedSettingsRef.current = merged;
          previewSettingsRef.current = null;
          setSavedSettings(merged);
          setPreviewSettings(null);
          applyTheme(merged.darkMode ? 'dark' : 'light');
        } catch {
          // ignore invalid storage payload
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Purge saved drafts whenever saved autoSave is off
  useEffect(() => {
    if (!savedSettings.autoSave) {
      clearUserDraftsFromStorage(userStorageScope);
    }
  }, [savedSettings.autoSave, userStorageScope]);

  const setAuthenticated = useCallback((authenticated: boolean) => {
    isAuthenticatedRef.current = authenticated;
  }, []);

  const setUserScope = useCallback((scope: string | null) => {
    const normalized = scope && scope.trim() ? scope.trim() : 'guest';
    writeLastScopeToStorage(normalized);
    if (scopeRef.current === normalized) return;
    scopeRef.current = normalized;
    const loaded = readSettingsFromStorage(normalized);
    savedSettingsRef.current = loaded;
    previewSettingsRef.current = null;
    setUserStorageScope(normalized);
    setSavedSettings(loaded);
    setPreviewSettings(null);
    applyTheme(loaded.darkMode ? 'dark' : 'light');
  }, []);

  const syncThemeFromServer = useCallback((serverTheme: ThemeMode | null | undefined) => {
    if (serverTheme !== 'light' && serverTheme !== 'dark') return;
    const nextDark = serverTheme === 'dark';
    const nextSaved = { ...savedSettingsRef.current, darkMode: nextDark };
    savedSettingsRef.current = nextSaved;
    previewSettingsRef.current = null;
    setSavedSettings(nextSaved);
    setPreviewSettings(null);
    applyTheme(serverTheme);
    writeSettingsToStorage(scopeRef.current, nextSaved);
  }, []);

  const updatePreviewSettings = useCallback(
    (updater: Partial<SystemSettings> | ((prev: SystemSettings) => SystemSettings)) => {
      const base = previewSettingsRef.current ?? savedSettingsRef.current;
      const next = typeof updater === 'function' ? updater(base) : { ...base, ...updater };
      previewSettingsRef.current = next;
      applyTheme(next.darkMode ? 'dark' : 'light');
      setPreviewSettings(next);
    },
    []
  );

  const saveSettings = useCallback((nextSettings?: SystemSettings) => {
    const target = sanitizeSettings(
      nextSettings ?? previewSettingsRef.current ?? savedSettingsRef.current
    );
    const themeMode: ThemeMode = target.darkMode ? 'dark' : 'light';

    savedSettingsRef.current = target;
    previewSettingsRef.current = null;
    applyTheme(themeMode);
    writeSettingsToStorage(scopeRef.current, target);

    setSavedSettings(target);
    setPreviewSettings(null);

    if (!target.autoSave) {
      clearUserDraftsFromStorage(scopeRef.current);
    }

    if (isAuthenticatedRef.current) {
      api.updateMyTheme(themeMode).catch(() => {});
    }
  }, []);

  const resetToDefaults = useCallback((): SystemSettings => {
    const defaults = { ...DEFAULT_SYSTEM_SETTINGS };
    const themeMode: ThemeMode = defaults.darkMode ? 'dark' : 'light';

    savedSettingsRef.current = defaults;
    previewSettingsRef.current = null;
    applyTheme(themeMode);
    writeSettingsToStorage(scopeRef.current, defaults);

    setSavedSettings(defaults);
    setPreviewSettings(null);

    if (isAuthenticatedRef.current) {
      api.updateMyTheme(themeMode).catch(() => {});
    }
    return defaults;
  }, []);

  const discardPreview = useCallback(() => {
    if (previewSettingsRef.current === null) return;
    previewSettingsRef.current = null;
    setPreviewSettings(null);
    applyTheme(savedSettingsRef.current.darkMode ? 'dark' : 'light');
  }, []);

  const value = useMemo(
    () => ({
      settings,
      savedSettings,
      userStorageScope,
      updatePreviewSettings,
      saveSettings,
      resetToDefaults,
      discardPreview,
      setUserScope,
      setAuthenticated,
      syncThemeFromServer,
    }),
    [
      settings,
      savedSettings,
      userStorageScope,
      updatePreviewSettings,
      saveSettings,
      resetToDefaults,
      discardPreview,
      setUserScope,
      setAuthenticated,
      syncThemeFromServer,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
};
