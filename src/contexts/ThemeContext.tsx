import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** Current theme mode setting (light/dark/system) */
  mode: ThemeMode;
  /** Resolved theme after system preference is applied (light/dark only) */
  resolvedTheme: ResolvedTheme;
  /** Set theme mode explicitly */
  setTheme: (mode: ThemeMode) => void;
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  /** Default theme mode if none is stored */
  defaultMode?: ThemeMode;
}

/**
 * Gets the system's preferred color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Resolves the actual theme to apply based on mode and system preference
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Apply theme class to HTML element
 */
function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * ThemeProvider component that manages theme state and persistence.
 * Handles light/dark/system theme modes with localStorage persistence.
 *
 * Features:
 * - Persists theme preference to localStorage (key: aurora-theme-preference)
 * - Detects system color scheme preference
 * - Listens for system theme changes when in system mode
 * - Applies theme class to HTML element
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultMode="system">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultMode = "system",
}: ThemeProviderProps) {
  const STORAGE_KEY = "aurora-theme-preference";

  // Initialize theme from localStorage or default
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return defaultMode;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    } catch (error) {
      console.warn("Failed to read theme from localStorage:", error);
    }

    return defaultMode;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(mode)
  );

  // Apply theme on mode or resolved theme change
  useEffect(() => {
    const newResolvedTheme = resolveTheme(mode);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme);
  }, [mode]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(newResolvedTheme);
      applyTheme(newResolvedTheme);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Legacy browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [mode]);

  // Persist theme preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  }, [mode]);

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const toggleTheme = () => {
    // When toggling, we only switch between light and dark (not system)
    setMode((prevMode) => {
      const currentResolved = prevMode === "system" ? resolvedTheme : prevMode;
      return currentResolved === "dark" ? "light" : "dark";
    });
  };

  const value: ThemeContextValue = {
    mode,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context.
 * Must be used within a ThemeProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { mode, resolvedTheme, setTheme, toggleTheme } = useThemeContext();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current: {resolvedTheme} (Mode: {mode})
 *     </button>
 *   );
 * }
 * ```
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }

  return context;
}
