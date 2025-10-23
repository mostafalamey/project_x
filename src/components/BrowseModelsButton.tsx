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
      className={`rounded-full border border-emerald-500/70 bg-emerald-500/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.45em] transition hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${className}`}
      onClick={onClick}
      aria-label={
        isOpen ? "Hide model browser panel" : "Browse available unit models"
      }
    >
      {isOpen ? "Hide" : "Browse"} Models
    </button>
  );
};
