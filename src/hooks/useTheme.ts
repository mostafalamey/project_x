import { useThemeContext } from "../contexts/ThemeContext";

/**
 * Convenient hook to access theme functionality.
 * Re-exports the theme context for easier imports.
 *
 * @example
 * ```tsx
 * import { useTheme } from '@/hooks/useTheme';
 *
 * function ThemeToggle() {
 *   const { resolvedTheme, toggleTheme } = useTheme();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} mode
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Set theme explicitly
 * function ThemePicker() {
 *   const { mode, setTheme } = useTheme();
 *
 *   return (
 *     <select value={mode} onChange={(e) => setTheme(e.target.value as any)}>
 *       <option value="light">Light</option>
 *       <option value="dark">Dark</option>
 *       <option value="system">System</option>
 *     </select>
 *   );
 * }
 * ```
 */
export const useTheme = useThemeContext;
