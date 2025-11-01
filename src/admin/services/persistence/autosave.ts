/**
 * Autosave Service
 * Handles automatic persistence of configuration changes to IndexedDB
 */

import { db } from "./dexieDB";

// ============================================================================
// Autosave Configuration
// ============================================================================

export const AUTOSAVE_DEBOUNCE_MS = 30000; // 30 seconds
export const AUTOSAVE_KEY_PREFIX = "autosave_";

// ============================================================================
// Autosave Functions
// ============================================================================

/**
 * Save data to autosave storage
 */
export async function saveAutosave<T>(key: string, data: T): Promise<void> {
  const autosaveKey = `${AUTOSAVE_KEY_PREFIX}${key}`;

  try {
    await db.autosave.put({
      key: autosaveKey,
      data: JSON.stringify(data),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error(`[Autosave] Failed to save ${key}:`, error);
    throw error;
  }
}

/**
 * Load data from autosave storage
 */
export async function loadAutosave<T>(key: string): Promise<T | null> {
  const autosaveKey = `${AUTOSAVE_KEY_PREFIX}${key}`;

  try {
    const snapshot = await db.autosave.get(autosaveKey);

    if (!snapshot) {
      return null;
    }

    return JSON.parse(snapshot.data) as T;
  } catch (error) {
    console.error(`[Autosave] Failed to load ${key}:`, error);
    return null;
  }
}

/**
 * Check if autosave exists for a key
 */
export async function hasAutosave(key: string): Promise<boolean> {
  const autosaveKey = `${AUTOSAVE_KEY_PREFIX}${key}`;
  const snapshot = await db.autosave.get(autosaveKey);
  return snapshot !== undefined;
}

/**
 * Get autosave timestamp
 */
export async function getAutosaveTimestamp(
  key: string
): Promise<number | null> {
  const autosaveKey = `${AUTOSAVE_KEY_PREFIX}${key}`;
  const snapshot = await db.autosave.get(autosaveKey);
  return snapshot?.timestamp ?? null;
}

/**
 * Delete autosave for a key
 */
export async function deleteAutosave(key: string): Promise<void> {
  const autosaveKey = `${AUTOSAVE_KEY_PREFIX}${key}`;
  await db.autosave.delete(autosaveKey);
}

/**
 * Clear all autosave data
 */
export async function clearAllAutosaves(): Promise<void> {
  const count = await db.autosave.count();
  await db.autosave.clear();
}

/**
 * Get all autosave keys
 */
export async function getAutosaveKeys(): Promise<string[]> {
  const snapshots = await db.autosave.toArray();
  return snapshots
    .map((s) => s.key)
    .filter((k) => k.startsWith(AUTOSAVE_KEY_PREFIX))
    .map((k) => k.substring(AUTOSAVE_KEY_PREFIX.length));
}

// ============================================================================
// Autosave Status
// ============================================================================

export interface AutosaveStatus {
  enabled: boolean;
  lastSaved: Date | null;
  isSaving: boolean;
  error: string | null;
}
