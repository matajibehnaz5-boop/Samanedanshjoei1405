import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { applyTheme, getSavedTheme, saveTheme } from '../theme';

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
  const [userStorageScope, setUserStorageScope] = useState<string>(() => readLastScopeFromStorage());
  const [savedSettings, setSavedSettings] = useState<SystemSettings>(() => {
    const initial = readSettingsFromStorage(readLastScopeFromStorage());
    applyTheme(initial.darkMode ? 'dark' : 'light');
    return initial;
  });
  const [previewSettings, setPreviewSettings] = useState<SystemSettings | null>(null);

  const settings = previewSettings ?? savedSettings;

  // Apply theme immediately on load and whenever effective darkMode changes (live preview / revert)
  useEffect(() => {
    applyTheme(settings.darkMode ? 'dark' : 'light');
  }, [settings.darkMode]);

  // Purge saved drafts whenever saved autoSave is off
  useEffect(() => {
    if (!savedSettings.autoSave) {
      clearUserDraftsFromStorage(userStorageScope);
    }
  }, [savedSettings.autoSave, userStorageScope]);

  const setUserScope = useCallback((scope: string | null) => {
    const normalized = scope && scope.trim() ? scope.trim() : 'guest';
    writeLastScopeToStorage(normalized);
    setUserStorageScope((prev) => {
      if (prev === normalized) return prev;
      const loaded = readSettingsFromStorage(normalized);
      setSavedSettings(loaded);
      setPreviewSettings(null);
      return normalized;
    });
  }, []);

  const updatePreviewSettings = useCallback(
    (updater: Partial<SystemSettings> | ((prev: SystemSettings) => SystemSettings)) => {
      setPreviewSettings((prevPreview) => {
        const base = prevPreview ?? savedSettings;
        return typeof updater === 'function' ? updater(base) : { ...base, ...updater };
      });
    },
    [savedSettings]
  );

  const saveSettings = useCallback(
    (nextSettings?: SystemSettings) => {
      const target = sanitizeSettings(nextSettings ?? previewSettings ?? savedSettings);
      setSavedSettings(target);
      setPreviewSettings(null);
      writeSettingsToStorage(userStorageScope, target);
      if (!target.autoSave) {
        clearUserDraftsFromStorage(userStorageScope);
      }
    },
    [previewSettings, savedSettings, userStorageScope]
  );

  const resetToDefaults = useCallback((): SystemSettings => {
    const defaults = { ...DEFAULT_SYSTEM_SETTINGS };
    setSavedSettings(defaults);
    setPreviewSettings(null);
    writeSettingsToStorage(userStorageScope, defaults);
    return defaults;
  }, [userStorageScope]);

  const discardPreview = useCallback(() => {
    setPreviewSettings(null);
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
