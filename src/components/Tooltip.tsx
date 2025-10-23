import { type ReactNode } from "react";

export interface TooltipProps {
  /** The title/heading text in emerald-300 */
  title?: string;
  /** The main content text in slate-100 */
  content?: string;
  /** The secondary/status text in slate-400 */
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
      className={`rounded-xl bg-slate-900/85 px-4 py-3 text-left shadow-xl shadow-slate-950/50 ${className}`}
    >
      {children ? (
        children
      ) : (
        <>
          {title && (
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-emerald-300">
              {title}
            </p>
          )}
          {content && (
            <p className="mt-1 text-sm font-medium text-slate-100">{content}</p>
          )}
          {footer && (
            <p className="mt-1 text-[0.75rem] text-slate-400">{footer}</p>
          )}
        </>
      )}
    </div>
  );
};
