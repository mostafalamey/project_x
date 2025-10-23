// Accessibility utilities for zoom/pan feature

/**
 * Announce zoom level change to screen readers
 */
export const announceZoom = (zoomLevel: number): void => {
  const percent = Math.round(zoomLevel * 100);
  const message = `Zoomed to ${percent} percent`;

  // Create temporary live region if it doesn't exist
  let liveRegion = document.getElementById("zoom-announcer");
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.id = "zoom-announcer";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    liveRegion.style.position = "absolute";
    liveRegion.style.width = "1px";
    liveRegion.style.height = "1px";
    liveRegion.style.padding = "0";
    liveRegion.style.margin = "-1px";
    liveRegion.style.overflow = "hidden";
    liveRegion.style.clip = "rect(0, 0, 0, 0)";
    liveRegion.style.whiteSpace = "nowrap";
    liveRegion.style.border = "0";
    document.body.appendChild(liveRegion);
  }

  // Update announcement
  liveRegion.textContent = message;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Handle keyboard zoom with appropriate increment
 */
export const handleKeyboardZoom = (
  currentZoom: number,
  direction: "in" | "out",
  increment: number,
  minZoom: number,
  maxZoom: number
): number => {
  const newZoom =
    direction === "in" ? currentZoom * increment : currentZoom / increment;

  return Math.max(minZoom, Math.min(maxZoom, newZoom));
};

/**
 * Get keyboard shortcut description for screen readers
 */
export const getKeyboardShortcuts = (): string => {
  return [
    "Plus or Equal: Zoom in",
    "Minus: Zoom out",
    "Zero: Reset zoom",
    "Arrow keys: Pan view",
    "Hold Shift for faster panning",
  ].join(". ");
};
