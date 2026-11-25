import { useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';

export function getFormDraftStorageKey(userScope: string, formKey: string): string {
  return `form_draft:${userScope || 'guest'}:${formKey}`;
}

export function loadFormDraft<T extends Record<string, any>>(
  userScope: string,
  formKey: string
): Partial<T> | null {
  try {
    const raw = localStorage.getItem(getFormDraftStorageKey(userScope, formKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Partial<T>;
  } catch {
    return null;
  }
}

export function clearFormDraft(userScope: string, formKey: string): void {
  try {
    localStorage.removeItem(getFormDraftStorageKey(userScope, formKey));
  } catch {
    // ignore storage errors
  }
}

/**
 * Persists a form draft in localStorage per user when settings.autoSave is enabled,
 * restores it when `isOpen` becomes true, and deletes it when autoSave is disabled or cleared.
 */
export function useFormAutosave<T extends Record<string, any>>(options: {
  formKey: string;
  isOpen: boolean;
  values: T;
  onRestore: (draft: Partial<T>) => void;
}) {
  const { formKey, isOpen, values, onRestore } = options;
  const { settings, userStorageScope } = useSettings();
  const isAutoSaveEnabled = settings.autoSave;

  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  const hasRestoredForOpenRef = useRef(false);

  // Restore once each time the form/modal opens while autoSave is enabled
  useEffect(() => {
    if (!isOpen) {
      hasRestoredForOpenRef.current = false;
      return;
    }

    if (!isAutoSaveEnabled) {
      clearFormDraft(userStorageScope, formKey);
      hasRestoredForOpenRef.current = true;
      return;
    }

    if (!hasRestoredForOpenRef.current) {
      hasRestoredForOpenRef.current = true;
      const saved = loadFormDraft<T>(userStorageScope, formKey);
      if (saved) {
        onRestoreRef.current(saved);
      }
    }
  }, [isOpen, isAutoSaveEnabled, userStorageScope, formKey]);

  const latestValuesRef = useRef<T>(values);
  latestValuesRef.current = values;

  const isAutoSaveEnabledRef = useRef(isAutoSaveEnabled);
  isAutoSaveEnabledRef.current = isAutoSaveEnabled;

  const skipNextPersistRef = useRef(false);

  // Save draft whenever values change while open & autoSave is on; delete when turned off
  useEffect(() => {
    if (!isAutoSaveEnabled) {
      skipNextPersistRef.current = false;
      clearFormDraft(userStorageScope, formKey);
      return;
    }

    if (!isOpen || !hasRestoredForOpenRef.current) return;

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    const persistDraft = () => {
      if (!isAutoSaveEnabledRef.current || skipNextPersistRef.current) return;
      try {
        const currentValues = latestValuesRef.current;
        const hasAnyValue = Object.values(currentValues).some((v) => {
          if (typeof v === 'string') return v.trim().length > 0;
          if (typeof v === 'boolean') return true;
          return v !== null && v !== undefined;
        });

        const key = getFormDraftStorageKey(userStorageScope, formKey);
        if (!hasAnyValue) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(currentValues));
        }
      } catch {
        // ignore storage errors
      }
    };

    const timer = window.setTimeout(persistDraft, 60);

    return () => {
      window.clearTimeout(timer);
      persistDraft();
    };
  }, [values, isOpen, isAutoSaveEnabled, userStorageScope, formKey]);

  const clearDraft = useCallback(() => {
    skipNextPersistRef.current = true;
    clearFormDraft(userStorageScope, formKey);
  }, [userStorageScope, formKey]);

  return { clearDraft, isAutoSaveEnabled };
}
