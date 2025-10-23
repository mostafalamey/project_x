// Type definitions for zoom/pan interactions and view transitions

export interface Point {
  x: number;
  y: number;
}

export interface ZoomPanState {
  /**
   * Current zoom level as a scale multiplier
   * Range: 1.0 (default) to 5.0 (maximum)
   * Increment: 1.1x per mouse wheel scroll
   */
  zoom: number;

  /**
   * Pan offset in pixels from the default center position
   * Constrained to keep at least a portion of content visible
   */
  pan: Point;

  /**
   * Whether the view is currently being interacted with
   * Used to show/hide affordances or prevent conflicting operations
   */
  isInteracting: boolean;

  /**
   * Transform origin point for zoom operations (0-1 normalized)
   * Default: { x: 0.5, y: 0.5 } (center)
   * Updated based on mouse cursor or touch point position
   */
  origin: Point;
}

export interface ZoomPanConfig {
  /** Minimum zoom level (default: 1.0) */
  minZoom: number;

  /** Maximum zoom level (default: 5.0) */
  maxZoom: number;

  /** Zoom increment multiplier per scroll (default: 1.1) */
  zoomIncrement: number;

  /** Animation duration in milliseconds (default: 300) */
  animationDuration: number;

  /** Easing function for animations (default: "easeOut") */
  easing: "linear" | "easeOut" | "easeInOut";

  /** Enable keyboard controls (default: true) */
  keyboardEnabled: boolean;

  /** Constrain panning to keep content visible (default: true) */
  constrainPan: boolean;
}

export interface ViewTransitionState {
  /**
   * Whether a transition is currently in progress
   * Prevents new transitions from starting during active transition
   */
  isTransitioning: boolean;

  /**
   * The point from which the zoom-in originates (0-1 normalized)
   * Based on the position of the clicked element (hotspot, button, etc.)
   */
  origin: Point;

  /**
   * Transition phase for multi-step animations
   */
  phase: "idle" | "zoom-out" | "fading" | "zoom-in" | "complete";

  /**
   * Source view identifier (for debugging/logging)
   */
  fromView?: string | undefined;

  /**
   * Target view identifier (for debugging/logging)
   */
  toView?: string | undefined;

  /**
   * Whether user has reduced motion preference enabled
   * If true, skip zoom effects and use simple fade
   */
  reducedMotion: boolean;
}

export interface KeyboardState {
  /** Currently pressed keys */
  keys: Set<string>;

  /** Whether Ctrl/Cmd key is pressed */
  ctrlKey: boolean;

  /** Whether Shift key is pressed */
  shiftKey: boolean;
}

export interface Bounds {
  width: number;
  height: number;
}
