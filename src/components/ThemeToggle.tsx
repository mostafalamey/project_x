import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme } from "../hooks/useTheme";

interface ThemeToggleProps {
  /** Additional CSS classes to apply to the button */
  className?: string;
}

/**
 * ThemeToggle component - Button to toggle between light and dark themes.
 *
 * Features:
 * - Displays sun icon in dark mode, moon icon in light mode
 * - Toggles between light and dark themes on click
 * - Uses design system tokens for styling
 * - Accessible with keyboard navigation and ARIA labels
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 *
 * @example
 * ```tsx
 * // With custom positioning
 * <ThemeToggle className="fixed top-4 right-4" />
 * ```
 */
export const ThemeToggle = ({ className = "" }: ThemeToggleProps) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useTranslation("common");

  const nextMode = resolvedTheme === "dark" ? "light" : "dark";
  const modeLabel = t(`themeToggle.modes.${nextMode}`);
  const controlLabel = t("themeToggle.ariaLabel", { mode: modeLabel });

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group inline-flex items-center justify-center rounded-button border border-border bg-surface-base p-sm transition-hover hover:border-border-hover hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`}
      aria-label={controlLabel}
      title={controlLabel}
    >
      {resolvedTheme === "dark" ? (
        <Sun
          className="h-5 w-5 text-text-secondary transition-color group-hover:text-text-accent"
          aria-hidden="true"
        />
      ) : (
        <Moon
          className="h-5 w-5 text-text-secondary transition-color group-hover:text-text-accent"
          aria-hidden="true"
        />
      )}
    </button>
  );
};
