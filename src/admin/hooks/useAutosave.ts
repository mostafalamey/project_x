/**
 * useAutosave Hook
 * Provides debounced autosave functionality with status indicators
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  saveAutosave,
  hasAutosave,
  loadAutosave,
  deleteAutosave,
  AUTOSAVE_DEBOUNCE_MS,
} from "../services/persistence/autosave";

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseAutosaveReturn {
  // Status
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;

  // Actions
  save: (key: string, data: unknown) => Promise<void>;
  load: (key: string) => Promise<unknown | null>;
  hasExisting: (key: string) => Promise<boolean>;
  discard: (key: string) => Promise<void>;
  markDirty: () => void;
  markClean: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAutosave(autoSaveKey?: string): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<{ key: string; data: unknown } | null>(null);

  // Debounced save function
  const debouncedSave = useCallback(async (key: string, data: unknown) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Store pending data
    pendingDataRef.current = { key, data };
    setHasUnsavedChanges(true);

    // Schedule save after debounce period
    saveTimeoutRef.current = setTimeout(async () => {
      if (!pendingDataRef.current) return;

      const { key: saveKey, data: saveData } = pendingDataRef.current;

      try {
        setIsSaving(true);
        setError(null);

        await saveAutosave(saveKey, saveData);

        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        pendingDataRef.current = null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save";
        setError(message);
        console.error("Autosave failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }, []);

  // Immediate save function (non-debounced)
  const save = useCallback(async (key: string, data: unknown) => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    try {
      setIsSaving(true);
      setError(null);

      await saveAutosave(key, data);

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      pendingDataRef.current = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Load autosaved data
  const load = useCallback(async (key: string): Promise<unknown | null> => {
    try {
      setError(null);
      return await loadAutosave(key);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load";
      setError(message);
      return null;
    }
  }, []);

  // Check if autosave exists
  const hasExisting = useCallback(async (key: string): Promise<boolean> => {
    try {
      return await hasAutosave(key);
    } catch (err) {
      console.error("Failed to check autosave:", err);
      return false;
    }
  }, []);

  // Delete autosave
  const discard = useCallback(async (key: string): Promise<void> => {
    try {
      await deleteAutosave(key);
      setHasUnsavedChanges(false);
      pendingDataRef.current = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to discard";
      setError(message);
      throw err;
    }
  }, []);

  // Manual dirty/clean markers
  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markClean = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  // Auto-save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Force save on unmount if there's pending data
      if (pendingDataRef.current && autoSaveKey) {
        const { data } = pendingDataRef.current;
        saveAutosave(autoSaveKey, data).catch((err) => {
          console.error("Failed to save on unmount:", err);
        });
      }
    };
  }, [autoSaveKey]);

  // Auto-save when key and data change (if autoSaveKey is provided)
  useEffect(() => {
    if (autoSaveKey && pendingDataRef.current) {
      debouncedSave(autoSaveKey, pendingDataRef.current.data);
    }
  }, [autoSaveKey, debouncedSave]);

  return {
    // Status
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    error,

    // Actions
    save,
    load,
    hasExisting,
    discard,
    markDirty,
    markClean,
  };
}
