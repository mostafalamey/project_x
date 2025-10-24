/**
 * Theme utility functions for localStorage persistence and OS preference detection.
 * These utilities support the theme management system defined in ThemeContext.
 */

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Storage key for theme preference in localStorage
 */
export const THEME_STORAGE_KEY = "aurora-theme-preference";

/**
 * Gets the current theme preference from localStorage.
 * Returns null if no preference is stored or if localStorage is unavailable.
 *
 * @returns The stored theme mode or null
 *
 * @example
 * ```ts
 * const savedTheme = getStoredTheme();
 * if (savedTheme) {
 *   console.log('User previously selected:', savedTheme);
 * }
 * ```
 */
export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }

    return null;
  } catch (error) {
    console.warn("Failed to read theme from localStorage:", error);
    return null;
  }
}

/**
 * Saves the theme preference to localStorage.
 * Silently fails if localStorage is unavailable (e.g., in private browsing mode).
 *
 * @param mode - The theme mode to save
 *
 * @example
 * ```ts
 * saveTheme('dark');
 * ```
 */
export function saveTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.warn("Failed to save theme to localStorage:", error);
  }
}

/**
 * Clears the stored theme preference from localStorage.
 *
 * @example
 * ```ts
 * clearStoredTheme();
 * ```
 */
export function clearStoredTheme(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear theme from localStorage:", error);
  }
}

/**
 * Detects the operating system's color scheme preference.
 * Uses the `prefers-color-scheme` media query.
 *
 * @returns 'dark' if the OS prefers dark mode, 'light' otherwise
 *
 * @example
 * ```ts
 * const osTheme = getOSThemePreference();
 * console.log('OS prefers:', osTheme);
 * ```
 */
export function getOSThemePreference(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  return prefersDark ? "dark" : "light";
}

/**
 * Resolves the actual theme to apply based on the mode and OS preference.
 * When mode is 'system', returns the OS preference.
 *
 * @param mode - The theme mode to resolve
 * @returns The resolved theme (light or dark)
 *
 * @example
 * ```ts
 * const theme = resolveTheme('system'); // Returns 'dark' or 'light' based on OS
 * const theme2 = resolveTheme('dark');  // Returns 'dark'
 * ```
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return getOSThemePreference();
  }
  return mode;
}

/**
 * Applies the theme by adding or removing the 'dark' class on the HTML element.
 * This function should be called before React renders to prevent flash of wrong theme.
 *
 * @param theme - The resolved theme to apply
 *
 * @example
 * ```ts
 * applyThemeClass('dark'); // Adds 'dark' class to <html>
 * applyThemeClass('light'); // Removes 'dark' class from <html>
 * ```
 */
export function applyThemeClass(theme: ResolvedTheme): void {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Initializes the theme by reading from localStorage or OS preference,
 * then applying the appropriate theme class to the HTML element.
 * This function is designed to be called inline in index.html to prevent FOUC.
 *
 * @returns The initialized theme mode
 *
 * @example
 * ```ts
 * // In index.html <head>:
 * const initialTheme = initializeTheme();
 * console.log('Initialized with theme:', initialTheme);
 * ```
 */
export function initializeTheme(): ThemeMode {
  const storedTheme = getStoredTheme();
  const mode: ThemeMode = storedTheme ?? "system";
  const resolvedTheme = resolveTheme(mode);

  applyThemeClass(resolvedTheme);

  return mode;
}

/**
 * Creates a media query listener to watch for OS theme preference changes.
 * Only activates when the current mode is 'system'.
 *
 * @param callback - Function to call when OS theme preference changes
 * @returns Cleanup function to remove the listener
 *
 * @example
 * ```ts
 * const cleanup = watchOSThemeChanges((newTheme) => {
 *   console.log('OS theme changed to:', newTheme);
 *   applyThemeClass(newTheme);
 * });
 *
 * // Later, to stop watching:
 * cleanup();
 * ```
 */
export function watchOSThemeChanges(
  callback: (theme: ResolvedTheme) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    const newTheme: ResolvedTheme = e.matches ? "dark" : "light";
    callback(newTheme);
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }

  // Legacy browsers
  mediaQuery.addListener(handleChange);
  return () => mediaQuery.removeListener(handleChange);
}
