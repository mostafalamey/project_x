import { type ReactNode } from "react";

export interface TooltipProps {
  /** The title/heading text */
  title?: string;
  /** The main content text */
  content?: string;
  /** The secondary/status text */
  footer?: string;
  /** Custom children for more complex tooltip content */
  children?: ReactNode;
  /** Additional CSS classes to apply to the container */
  className?: string;
}

/**
 * Reusable Tooltip component with consistent styling across the application.
 * Based on the FloorPlan view tooltip design.
 *
 * @example
 * // Simple usage with props
 * <Tooltip
 *   title="A-101"
 *   content="120 m² · 2 bed · 2 bath"
 *   footer="Status: Available"
 * />
 *
 * @example
 * // Custom content with children
 * <Tooltip>
 *   <p className="text-xs uppercase tracking-widest text-emerald-300">Building A</p>
 *   <p className="mt-1 text-sm text-slate-100">5 floors · 12 units available</p>
 * </Tooltip>
 */
export const Tooltip = ({
  title,
  content,
  footer,
  children,
  className = "",
}: TooltipProps) => {
  return (
    <div
      className={`rounded-tooltip bg-surface-elevated px-md py-sm text-left shadow-tooltip ${className}`}
    >
      {children ? (
        children
      ) : (
        <>
          {title && (
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-text-accent">
              {title}
            </p>
          )}
          {content && (
            <p className="mt-xs text-sm font-medium text-text-primary">
              {content}
            </p>
          )}
          {footer && (
            <p className="mt-xs text-[0.75rem] text-text-secondary">{footer}</p>
          )}
        </>
      )}
    </div>
  );
};
