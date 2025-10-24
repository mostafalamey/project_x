interface BrowseModelsButtonProps {
  /** Whether the browse models panel is currently shown */
  isOpen: boolean;
  /** Callback when the button is clicked */
  onClick: () => void;
  /** Additional CSS classes to apply to the button */
  className?: string;
}

/**
 * Reusable Browse Models button component with consistent styling.
 * Based on the MasterPlan view button design.
 *
 * @example
 * <BrowseModelsButton
 *   isOpen={showSearch}
 *   onClick={() => setShowSearch(!showSearch)}
 * />
 */
export const BrowseModelsButton = ({
  isOpen,
  onClick,
  className = "",
}: BrowseModelsButtonProps) => {
  return (
    <button
      type="button"
      className={`rounded-badge border border-border-focus/70 bg-primary/10 px-md py-sm text-xs font-semibold uppercase tracking-[0.45em] transition-hover hover:border-primary-hover hover:bg-primary/20 hover:text-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`}
      onClick={onClick}
      aria-label={
        isOpen ? "Hide model browser panel" : "Browse available unit models"
      }
    >
      {isOpen ? "Hide" : "Browse"} Models
    </button>
  );
};
