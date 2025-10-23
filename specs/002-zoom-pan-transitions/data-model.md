# Data Model: Interactive Zoom, Pan, and View Transitions

**Feature**: 002-zoom-pan-transitions  
**Date**: 2025-10-23  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data structures, types, and state models for zoom/pan interactions and view transitions. Since this is a purely client-side feature with no backend persistence, all state is transient and managed in React components and hooks.

## Core Entities

### 1. ZoomPanState

Represents the current zoom and pan state for a view.

**TypeScript Definition**:

```typescript
interface ZoomPanState {
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
  pan: {
    x: number;
    y: number;
  };

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
  origin: {
    x: number;
    y: number;
  };
}
```

**Lifecycle**:

- **Created**: When a zoomable view mounts
- **Updated**: On wheel scroll, pinch gesture, drag, keyboard input
- **Reset**: On navigation to different view OR angle change in master plan
- **Destroyed**: When view unmounts

**Validation Rules**:

- `zoom` must be >= 1.0 and <= 5.0
- `pan.x` and `pan.y` must be constrained such that content remains partially visible
- `origin.x` and `origin.y` must be >= 0.0 and <= 1.0

**State Transitions**:

```text
Default (zoom=1, pan={0,0}, isInteracting=false)
  ↓ user scrolls wheel
Zooming (zoom changes, isInteracting=true, origin=cursor position)
  ↓ animation completes
Zoomed (zoom updated, isInteracting=false)
  ↓ user drags
Panning (pan changes, isInteracting=true)
  ↓ drag ends
Panned (pan updated, isInteracting=false)
  ↓ user navigates away
Reset to Default
```

### 2. ViewTransitionState

Represents an active view-to-view transition with zoom effects.

**TypeScript Definition**:

```typescript
interface ViewTransitionState {
  /**
   * Whether a transition is currently in progress
   * Prevents new transitions from starting during active transition
   */
  isTransitioning: boolean;

  /**
   * The point from which the zoom-in originates (0-1 normalized)
   * Based on the position of the clicked element (hotspot, button, etc.)
   */
  origin: {
    x: number;
    y: number;
  };

  /**
   * Transition phase for multi-step animations
   */
  phase: "idle" | "zoom-out" | "fading" | "zoom-in" | "complete";

  /**
   * Source view identifier (for debugging/logging)
   */
  fromView?: string;

  /**
   * Target view identifier (for debugging/logging)
   */
  toView?: string;

  /**
   * Whether user has reduced motion preference enabled
   * If true, skip zoom effects and use simple fade
   */
  reducedMotion: boolean;
}
```

**Lifecycle**:

- **Created**: When user triggers navigation (clicks hotspot, button, etc.)
- **Updated**: As transition progresses through phases
- **Destroyed**: When transition completes and new view is interactive

**State Transitions**:

```text
idle (no transition)
  ↓ user clicks navigation element
zoom-out (current view zooms in toward origin, 300ms)
  ↓ zoom-out completes
fading (crossfade between views, 200ms)
  ↓ fade completes
zoom-in (new view zooms out from zoomed state, 300ms)
  ↓ zoom-in completes
complete (brief pause to ensure stability)
  ↓ reset
idle
```

**Total Duration**: 800ms (0.6-1.2s as per spec FR-009)

**Validation Rules**:

- Only one transition can be active at a time
- `origin.x` and `origin.y` must be >= 0.0 and <= 1.0
- Phase transitions must follow sequence (no skipping)
- If `reducedMotion` is true, phases collapse to simple fade (skip zoom-out and zoom-in)

### 3. PanoramaZoomState

Represents zoom state specific to 360° panorama views.

**TypeScript Definition**:

```typescript
interface PanoramaZoomState {
  /**
   * Current field of view in degrees
   * Range: 30° (zoomed in) to 90° (zoomed out/default)
   * Lower FOV = more zoomed in (details larger)
   */
  fieldOfView: number;

  /**
   * Whether zoom is currently animating
   */
  isAnimating: boolean;

  /**
   * Target FOV for current animation (if animating)
   */
  targetFov?: number;
}
```

**Lifecycle**:

- **Created**: When panorama viewer initializes
- **Updated**: On wheel scroll or pinch gesture
- **Reset**: On scene navigation (hotspot click)
- **Destroyed**: When panorama viewer unmounts

**Validation Rules**:

- `fieldOfView` must be >= 30° and <= 90°
- Animations use 200ms duration with ease-out easing

**State Transitions**:

```text
Default (fov=50°, isAnimating=false)
  ↓ user scrolls wheel
Animating (isAnimating=true, targetFov=new value)
  ↓ animation completes (200ms)
Zoomed (fov=targetFov, isAnimating=false)
  ↓ user clicks hotspot
Reset to Default
```

### 4. KeyboardState

Tracks active keyboard modifiers for accessibility controls.

**TypeScript Definition**:

```typescript
interface KeyboardState {
  /**
   * Whether Ctrl/Cmd key is pressed
   * Used for alternative zoom behavior (Ctrl+wheel in some contexts)
   */
  ctrlPressed: boolean;

  /**
   * Whether Shift key is pressed
   * Could be used for constrained pan (horizontal/vertical only)
   */
  shiftPressed: boolean;

  /**
   * Last announced zoom level (to avoid redundant screen reader announcements)
   */
  lastAnnouncedZoom: number;
}
```

**Lifecycle**:

- **Created**: When zoomable view mounts
- **Updated**: On keydown/keyup events
- **Destroyed**: When view unmounts

## Type Definitions

**File**: `src/types/zoom-pan.d.ts`

```typescript
/**
 * Point in 2D space (pixels or normalized 0-1)
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Bounding rectangle for constraint calculations
 */
export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Configuration for zoom/pan behavior
 */
export interface ZoomPanConfig {
  /** Minimum zoom level (default: 1.0) */
  minZoom?: number;

  /** Maximum zoom level (default: 5.0) */
  maxZoom?: number;

  /** Zoom increment per scroll (default: 1.1) */
  zoomIncrement?: number;

  /** Animation duration in ms (default: 300) */
  animationDuration?: number;

  /** Easing function (default: 'easeOut') */
  easing?: "linear" | "easeOut" | "easeInOut";

  /** Whether to enable keyboard controls (default: true) */
  keyboardEnabled?: boolean;

  /** Whether to constrain pan to keep content visible (default: true) */
  constrainPan?: boolean;
}

/**
 * View transition configuration
 */
export interface TransitionConfig {
  /** Duration of zoom-out phase in ms (default: 300) */
  zoomOutDuration?: number;

  /** Duration of fade phase in ms (default: 200) */
  fadeDuration?: number;

  /** Duration of zoom-in phase in ms (default: 300) */
  zoomInDuration?: number;

  /** Zoom scale for transition endpoints (default: 1.5) */
  transitionZoomScale?: number;

  /** Whether to respect prefers-reduced-motion (default: true) */
  respectReducedMotion?: number;
}

/**
 * Event handlers for zoom/pan interactions
 */
export interface ZoomPanHandlers {
  onZoomStart?: (zoom: number) => void;
  onZoomChange?: (zoom: number) => void;
  onZoomEnd?: (zoom: number) => void;
  onPanStart?: (pan: Point) => void;
  onPanChange?: (pan: Point) => void;
  onPanEnd?: (pan: Point) => void;
  onReset?: () => void;
}
```

## Hook APIs

### useZoomPan Hook

**Purpose**: Manage zoom and pan state for static image views

**API**:

```typescript
function useZoomPan(config?: ZoomPanConfig): {
  // State
  zoom: number;
  pan: Point;
  isInteracting: boolean;
  origin: Point;

  // Methods
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;

  // Event handlers (to be attached to container element)
  handleWheel: (e: WheelEvent) => void;
  handlePointerDown: (e: PointerEvent) => void;
  handlePointerMove: (e: PointerEvent) => void;
  handlePointerUp: (e: PointerEvent) => void;
  handleKeyDown: (e: KeyboardEvent) => void;

  // CSS transform string for easy rendering
  transformStyle: string;
};
```

**Usage Example**:

```typescript
const MyView = () => {
  const { zoom, pan, handleWheel, transformStyle } = useZoomPan({
    minZoom: 1,
    maxZoom: 5,
    zoomIncrement: 1.1,
  });

  return (
    <div onWheel={handleWheel} tabIndex={0}>
      <div style={{ transform: transformStyle }}>
        <img src="floor-plan.png" alt="Floor plan" />
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        Zoom level: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};
```

### useViewTransition Hook

**Purpose**: Orchestrate zoom-based transitions between views

**API**:

```typescript
function useViewTransition(config?: TransitionConfig): {
  // State
  isTransitioning: boolean;
  origin: Point;
  phase: TransitionPhase;
  reducedMotion: boolean;

  // Methods
  transitionTo: (path: string, clickPosition: Point) => void;
  cancelTransition: () => void;

  // Animation variants for Framer Motion
  exitVariant: MotionProps;
  enterVariant: MotionProps;
};
```

**Usage Example**:

```typescript
const MasterPlanView = () => {
  const { transitionTo, exitVariant } = useViewTransition();

  const handleBuildingClick = (buildingId: string, clickEvent: MouseEvent) => {
    const rect = clickEvent.currentTarget.getBoundingClientRect();
    const origin = {
      x: (clickEvent.clientX - rect.left) / rect.width,
      y: (clickEvent.clientY - rect.top) / rect.height,
    };

    transitionTo(`/building/${buildingId}`, origin);
  };

  return <motion.div {...exitVariant}>{/* Master plan content */}</motion.div>;
};
```

### usePanoramaZoom Hook

**Purpose**: Manage field of view zoom for 360° panorama viewers

**API**:

```typescript
function usePanoramaZoom(
  viewerRef: RefObject<Viewer>,
  config?: { minFov?: number; maxFov?: number }
): {
  // State
  fieldOfView: number;
  isAnimating: boolean;

  // Methods
  setFov: (fov: number) => void;
  reset: () => void;

  // Event handler
  handleWheel: (e: WheelEvent) => void;
};
```

## Context Provider

### TransitionContext

Provides transition state to all views without prop drilling.

**API**:

```typescript
interface TransitionContextValue {
  state: ViewTransitionState;
  startTransition: (origin: Point, fromView: string, toView: string) => void;
  completeTransition: () => void;
}

// Provider component
<TransitionProvider>
  <RouterProvider />
</TransitionProvider>;

// Consumer hook
const { state, startTransition } = useContext(TransitionContext);
```

## Persistence & Storage

**No persistence required** - all state is transient and resets on page reload or navigation. This aligns with the static web app constitution (no backend, no local storage).

## Performance Considerations

### State Update Frequency

- **Zoom updates**: Throttled to 16ms (60 FPS max)
- **Pan updates**: On pointer move (native browser throttling)
- **Transition updates**: Driven by Framer Motion (optimized internally)

### Memory Usage

- **Per view**: ~1KB for zoom/pan state
- **Global transition state**: ~500 bytes
- **Total impact**: Negligible (<10KB total)

## Validation & Constraints

### Runtime Validation

```typescript
// Zoom validation
const clampZoom = (zoom: number, min = 1, max = 5): number => {
  return Math.max(min, Math.min(max, zoom));
};

// Pan constraint (keep content partially visible)
const constrainPan = (
  pan: Point,
  zoom: number,
  containerSize: Size,
  contentSize: Size
): Point => {
  const scaledWidth = contentSize.width * zoom;
  const scaledHeight = contentSize.height * zoom;

  const maxX = Math.max(0, (scaledWidth - containerSize.width) / 2);
  const maxY = Math.max(0, (scaledHeight - containerSize.height) / 2);

  return {
    x: Math.max(-maxX, Math.min(maxX, pan.x)),
    y: Math.max(-maxY, Math.min(maxY, pan.y)),
  };
};

// Origin validation (0-1 normalized)
const clampOrigin = (origin: Point): Point => ({
  x: Math.max(0, Math.min(1, origin.x)),
  y: Math.max(0, Math.min(1, origin.y)),
});
```

## Testing Considerations

### Unit Tests

- Zoom increment calculation (1.1x per scroll)
- Pan constraint logic (content stays partially visible)
- Origin point normalization (click position → 0-1 range)
- State transition sequences (idle → zooming → zoomed)

### Integration Tests

- Wheel event → zoom state update → render update
- Pinch gesture → zoom calculation → constrained update
- Keyboard input → zoom/pan change → ARIA announcement
- Navigation click → transition sequence → new view loads

### Accessibility Tests

- Keyboard-only zoom/pan (no mouse)
- Screen reader announcements on zoom changes
- Reduced motion preference respected
- Focus trap during transitions

## Conclusion

Data model is purely in-memory with no persistence requirements. All entities have clear lifecycles, validation rules, and state transitions. Hook-based APIs provide clean abstractions for view components. Ready to proceed to contract generation (though no API contracts needed for pure client-side feature).
