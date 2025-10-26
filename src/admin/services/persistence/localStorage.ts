/**
 * LocalStorage Service
 * Handles user preferences and settings in browser localStorage
 */

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_PREFIX = "admin_config_";

export const StorageKeys = {
  THEME: `${STORAGE_PREFIX}theme`,
  SIDEBAR_COLLAPSED: `${STORAGE_PREFIX}sidebar_collapsed`,
  SIDEBAR_WIDTH: `${STORAGE_PREFIX}sidebar_width`,
  PROPERTIES_PANEL_WIDTH: `${STORAGE_PREFIX}properties_panel_width`,
  LAST_PROJECT_ID: `${STORAGE_PREFIX}last_project_id`,
  CANVAS_ZOOM: `${STORAGE_PREFIX}canvas_zoom`,
  CANVAS_GRID_ENABLED: `${STORAGE_PREFIX}canvas_grid_enabled`,
  AUTOSAVE_ENABLED: `${STORAGE_PREFIX}autosave_enabled`,
} as const;

// ============================================================================
// Generic Storage Functions
// ============================================================================

/**
 * Save value to localStorage
 */
export function setItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`[LocalStorage] Failed to save ${key}:`, error);
  }
}

/**
 * Load value from localStorage
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const serialized = localStorage.getItem(key);

    if (serialized === null) {
      return defaultValue;
    }

    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`[LocalStorage] Failed to load ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Remove item from localStorage
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[LocalStorage] Failed to remove ${key}:`, error);
  }
}

/**
 * Clear all admin config items from localStorage
 */
export function clearAll(): void {
  try {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(STORAGE_PREFIX)
    );

    keys.forEach((key) => localStorage.removeItem(key));
    console.log(`[LocalStorage] Cleared ${keys.length} items`);
  } catch (error) {
    console.error("[LocalStorage] Failed to clear all items:", error);
  }
}

// ============================================================================
// Specific Preference Getters/Setters
// ============================================================================

export function getTheme(): "light" | "dark" | "system" {
  return getItem(StorageKeys.THEME, "system");
}

export function setTheme(theme: "light" | "dark" | "system"): void {
  setItem(StorageKeys.THEME, theme);
}

export function getSidebarCollapsed(): boolean {
  return getItem(StorageKeys.SIDEBAR_COLLAPSED, false);
}

export function setSidebarCollapsed(collapsed: boolean): void {
  setItem(StorageKeys.SIDEBAR_COLLAPSED, collapsed);
}

export function getSidebarWidth(): number {
  return getItem(StorageKeys.SIDEBAR_WIDTH, 256); // Default 256px
}

export function setSidebarWidth(width: number): void {
  setItem(StorageKeys.SIDEBAR_WIDTH, width);
}

export function getPropertiesPanelWidth(): number {
  return getItem(StorageKeys.PROPERTIES_PANEL_WIDTH, 384); // Default 384px
}

export function setPropertiesPanelWidth(width: number): void {
  setItem(StorageKeys.PROPERTIES_PANEL_WIDTH, width);
}

export function getLastProjectId(): string | null {
  return getItem<string | null>(StorageKeys.LAST_PROJECT_ID, null);
}

export function setLastProjectId(projectId: string): void {
  setItem(StorageKeys.LAST_PROJECT_ID, projectId);
}

export function getCanvasZoom(): number {
  return getItem(StorageKeys.CANVAS_ZOOM, 1.0);
}

export function setCanvasZoom(zoom: number): void {
  setItem(StorageKeys.CANVAS_ZOOM, zoom);
}

export function getCanvasGridEnabled(): boolean {
  return getItem(StorageKeys.CANVAS_GRID_ENABLED, false);
}

export function setCanvasGridEnabled(enabled: boolean): void {
  setItem(StorageKeys.CANVAS_GRID_ENABLED, enabled);
}

export function getAutosaveEnabled(): boolean {
  return getItem(StorageKeys.AUTOSAVE_ENABLED, true);
}

export function setAutosaveEnabled(enabled: boolean): void {
  setItem(StorageKeys.AUTOSAVE_ENABLED, enabled);
}
