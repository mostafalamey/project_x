# Quickstart: Interactive Zoom, Pan, and View Transitions

**Feature**: 002-zoom-pan-transitions  
**Date**: 2025-10-23  
**Audience**: Developers implementing this feature

## Overview

This quickstart provides step-by-step guidance for implementing zoom/pan interactions and view transitions in the Aurora Complex Interactive Viewer. Implementation follows a hook-based, component-driven approach using existing dependencies (React, TypeScript, Framer Motion).

## Prerequisites

- Feature branch `002-zoom-pan-transitions` checked out
- Node.js >= 18.17.0
- Dependencies installed (`npm install`)
- Familiarity with React hooks and TypeScript
- Basic understanding of Framer Motion animations

## Implementation Sequence

Follow this sequence to minimize integration issues and enable incremental testing:

### Phase 1: Core Infrastructure (2-3 days)

#### Step 1.1: Type Definitions (~1 hour)

Create type definitions for zoom/pan state and configurations.

**File**: `src/types/zoom-pan.d.ts`

```typescript
export interface Point {
  x: number;
  y: number;
}

export interface ZoomPanState {
  zoom: number;
  pan: Point;
  isInteracting: boolean;
  origin: Point;
}

export interface ZoomPanConfig {
  minZoom?: number;
  maxZoom?: number;
  zoomIncrement?: number;
  animationDuration?: number;
  easing?: "linear" | "easeOut" | "easeInOut";
  keyboardEnabled?: boolean;
  constrainPan?: boolean;
}

// ... (see data-model.md for full definitions)
```

**Test**: TypeScript compilation passes (`npm run lint`)

#### Step 1.2: Utility Functions (~2 hours)

Create helper functions for zoom/pan calculations.

**File**: `src/utils/animation.ts`

```typescript
/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Throttle a function to max rate (ms)
 */
export const throttle = <T extends (...args: any[]) => void>(
  fn: T,
  wait: number
): T => {
  let lastCall = 0;
  return ((...args) => {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
};

/**
 * Calculate distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Constrain pan to keep content partially visible
 */
export const constrainPan = (
  pan: Point,
  zoom: number,
  containerSize: { width: number; height: number },
  contentSize: { width: number; height: number }
): Point => {
  const scaledWidth = contentSize.width * zoom;
  const scaledHeight = contentSize.height * zoom;

  const maxX = Math.max(0, (scaledWidth - containerSize.width) / 2);
  const maxY = Math.max(0, (scaledHeight - containerSize.height) / 2);

  return {
    x: clamp(pan.x, -maxX, maxX),
    y: clamp(pan.y, -maxY, maxY),
  };
};
```

**Test**: Unit tests for clamp, throttle, distance, constrainPan

#### Step 1.3: Accessibility Helpers (~2 hours)

Create keyboard handlers and ARIA announcements.

**File**: `src/utils/accessibility.ts`

```typescript
/**
 * Announce zoom level to screen readers
 */
export const announceZoom = (zoom: number): void => {
  const announcement = `Zoom level: ${Math.round(zoom * 100)} percent`;

  // Find or create live region
  let liveRegion = document.getElementById("zoom-announce");
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.id = "zoom-announce";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    document.body.appendChild(liveRegion);
  }

  liveRegion.textContent = announcement;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Keyboard event handler for zoom/pan
 */
export const handleZoomPanKeys = (
  e: KeyboardEvent,
  state: ZoomPanState,
  setState: (state: Partial<ZoomPanState>) => void,
  config: ZoomPanConfig
): void => {
  const { zoom, pan } = state;
  const increment = config.zoomIncrement || 1.1;
  const panStep = 20; // pixels

  switch (e.key) {
    case "+":
    case "=":
      e.preventDefault();
      const newZoomIn = clamp(
        zoom * increment,
        config.minZoom || 1,
        config.maxZoom || 5
      );
      setState({ zoom: newZoomIn });
      announceZoom(newZoomIn);
      break;

    case "-":
    case "_":
      e.preventDefault();
      const newZoomOut = clamp(
        zoom / increment,
        config.minZoom || 1,
        config.maxZoom || 5
      );
      setState({ zoom: newZoomOut });
      announceZoom(newZoomOut);
      break;

    case "ArrowUp":
      if (zoom > 1) {
        e.preventDefault();
        setState({ pan: { x: pan.x, y: pan.y + panStep } });
      }
      break;

    case "ArrowDown":
      if (zoom > 1) {
        e.preventDefault();
        setState({ pan: { x: pan.x, y: pan.y - panStep } });
      }
      break;

    case "ArrowLeft":
      if (zoom > 1) {
        e.preventDefault();
        setState({ pan: { x: pan.x + panStep, y: pan.y } });
      }
      break;

    case "ArrowRight":
      if (zoom > 1) {
        e.preventDefault();
        setState({ pan: { x: pan.x - panStep, y: pan.y } });
      }
      break;

    case "Escape":
      e.preventDefault();
      setState({ zoom: 1, pan: { x: 0, y: 0 } });
      announceZoom(1);
      break;
  }
};
```

**Test**: Keyboard navigation works without mouse, screen reader announces zoom

#### Step 1.4: useZoomPan Hook (~4 hours)

Create the core hook for zoom/pan state management.

**File**: `src/hooks/useZoomPan.ts`

```typescript
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ZoomPanState, ZoomPanConfig, Point } from "../types/zoom-pan";
import { clamp, throttle, constrainPan } from "../utils/animation";
import {
  handleZoomPanKeys,
  prefersReducedMotion,
} from "../utils/accessibility";

export const useZoomPan = (config: ZoomPanConfig = {}) => {
  const {
    minZoom = 1,
    maxZoom = 5,
    zoomIncrement = 1.1,
    animationDuration = 300,
    easing = "easeOut",
    keyboardEnabled = true,
    constrainPan: shouldConstrain = true,
  } = config;

  const [state, setState] = useState<ZoomPanState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    isInteracting: false,
    origin: { x: 0.5, y: 0.5 },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, Point>>(new Map());
  const initialPinchDistance = useRef<number>(0);

  // Wheel handler (mouse wheel zoom)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 1 / zoomIncrement : zoomIncrement;
      const newZoom = clamp(state.zoom * delta, minZoom, maxZoom);

      // Calculate origin from mouse position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const origin = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        };
        setState((s) => ({ ...s, zoom: newZoom, origin }));
      } else {
        setState((s) => ({ ...s, zoom: newZoom }));
      }
    },
    [state.zoom, zoomIncrement, minZoom, maxZoom]
  );

  // Throttled wheel handler (60 FPS max)
  const throttledWheel = useMemo(
    () => throttle(handleWheel, 16),
    [handleWheel]
  );

  // Pointer handlers (touch/mouse pan)
  const handlePointerDown = useCallback((e: PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setState((s) => ({ ...s, isInteracting: true }));

    if (pointers.current.size === 2) {
      const points = Array.from(pointers.current.values());
      initialPinchDistance.current = distance(points[0], points[1]);
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;

      const prev = pointers.current.get(e.pointerId)!;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 2) {
        // Pinch zoom
        const points = Array.from(pointers.current.values());
        const currentDistance = distance(points[0], points[1]);
        const scale = currentDistance / initialPinchDistance.current;
        const newZoom = clamp(state.zoom * scale, minZoom, maxZoom);
        setState((s) => ({ ...s, zoom: newZoom }));
        initialPinchDistance.current = currentDistance;
      } else if (pointers.current.size === 1 && state.zoom > 1) {
        // Pan
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;

        let newPan = {
          x: state.pan.x + dx,
          y: state.pan.y + dy,
        };

        if (shouldConstrain && containerRef.current) {
          const containerSize = {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          };
          const contentSize = {
            width: containerRef.current.scrollWidth / state.zoom,
            height: containerRef.current.scrollHeight / state.zoom,
          };
          newPan = constrainPan(newPan, state.zoom, containerSize, contentSize);
        }

        setState((s) => ({ ...s, pan: newPan }));
      }
    },
    [state.zoom, state.pan, minZoom, maxZoom, shouldConstrain]
  );

  const handlePointerUp = useCallback((e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      setState((s) => ({ ...s, isInteracting: false }));
    }
  }, []);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!keyboardEnabled) return;
      handleZoomPanKeys(
        e,
        state,
        (partial) => setState((s) => ({ ...s, ...partial })),
        config
      );
    },
    [keyboardEnabled, state, config]
  );

  // Public methods
  const reset = useCallback(() => {
    setState({
      zoom: 1,
      pan: { x: 0, y: 0 },
      isInteracting: false,
      origin: { x: 0.5, y: 0.5 },
    });
  }, []);

  const zoomIn = useCallback(() => {
    const newZoom = clamp(state.zoom * zoomIncrement, minZoom, maxZoom);
    setState((s) => ({ ...s, zoom: newZoom }));
  }, [state.zoom, zoomIncrement, minZoom, maxZoom]);

  const zoomOut = useCallback(() => {
    const newZoom = clamp(state.zoom / zoomIncrement, minZoom, maxZoom);
    setState((s) => ({ ...s, zoom: newZoom }));
  }, [state.zoom, zoomIncrement, minZoom, maxZoom]);

  // Transform style for rendering
  const transformStyle = useMemo(() => {
    return `scale(${state.zoom}) translate(${state.pan.x}px, ${state.pan.y}px)`;
  }, [state.zoom, state.pan]);

  return {
    ...state,
    containerRef,
    handleWheel: throttledWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    reset,
    zoomIn,
    zoomOut,
    transformStyle,
  };
};
```

**Test**: Basic zoom with mouse wheel, pan with drag, keyboard controls

### Phase 2: View Integration (2-3 days)

#### Step 2.1: ZoomPanContainer Component (~2 hours)

Create reusable wrapper component.

**File**: `src/components/ZoomPanContainer.tsx`

```typescript
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useZoomPan } from "../hooks/useZoomPan";
import { ZoomPanConfig } from "../types/zoom-pan";

interface ZoomPanContainerProps {
  children: ReactNode;
  config?: ZoomPanConfig;
  className?: string;
}

export const ZoomPanContainer = ({
  children,
  config,
  className = "",
}: ZoomPanContainerProps) => {
  const {
    zoom,
    pan,
    containerRef,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    transformStyle,
  } = useZoomPan(config);

  return (
    <div
      ref={containerRef}
      className={`zoom-pan-container ${className}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="img"
      aria-label="Zoomable view (use +/- to zoom, arrow keys to pan)"
      style={{
        overflow: "hidden",
        position: "relative",
        cursor: zoom > 1 ? "grab" : "default",
      }}
    >
      <motion.div
        style={{ transform: transformStyle, willChange: "transform" }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
      >
        {children}
      </motion.div>

      {/* ARIA live region for zoom announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Zoom level: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};
```

**Test**: Wrap a simple image, verify zoom/pan works

#### Step 2.2: Integrate with FloorPlanView (~1 hour)

Modify existing floor plan page to use zoom/pan.

**File**: `src/pages/FloorPlanView.tsx`

```typescript
// Add import
import { ZoomPanContainer } from '../components/ZoomPanContainer';

// Wrap the SVG content
<ZoomPanContainer config={{ minZoom: 1, maxZoom: 5 }}>
  <svg viewBox={...} ...>
    {/* existing floor plan content */}
  </svg>
</ZoomPanContainer>
```

**Test**: Floor plan zooms and pans smoothly, units remain clickable

#### Step 2.3: Integrate with MasterPlanView (~2 hours)

Add zoom/pan with special angle transition handling.

**File**: `src/pages/MasterPlanView.tsx`

```typescript
import { ZoomPanContainer } from "../components/ZoomPanContainer";
import { useZoomPan } from "../hooks/useZoomPan";

// Inside component
const { zoom, reset: resetZoom } = useZoomPan();

const handleAngleChange = (newAngle: number) => {
  if (zoom > 1) {
    // Zoom out first, then play sequence
    resetZoom();
    setTimeout(() => playAngleSequence(newAngle), 300);
  } else {
    playAngleSequence(newAngle);
  }
};

// Wrap master plan image
<ZoomPanContainer>{/* master plan content */}</ZoomPanContainer>;
```

**Test**: Angle switching resets zoom first, then plays sequence

#### Step 2.4: Integrate with Other Views (~2 hours)

Apply zoom/pan to MapView, BuildingView, and TourViewer.

**Test**: All static image views support zoom/pan

### Phase 3: View Transitions (2-3 days)

#### Step 3.1: TransitionContext (~2 hours)

Create context provider for transition state.

**File**: `src/contexts/TransitionContext.tsx`

```typescript
import { createContext, useContext, useState, ReactNode } from "react";
import { ViewTransitionState, Point } from "../types/zoom-pan";
import { prefersReducedMotion } from "../utils/accessibility";

const TransitionContext = createContext<{
  state: ViewTransitionState;
  startTransition: (origin: Point, from: string, to: string) => void;
  completeTransition: () => void;
} | null>(null);

export const TransitionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ViewTransitionState>({
    isTransitioning: false,
    origin: { x: 0.5, y: 0.5 },
    phase: "idle",
    reducedMotion: prefersReducedMotion(),
  });

  const startTransition = (origin: Point, fromView: string, toView: string) => {
    setState({
      isTransitioning: true,
      origin,
      phase: "zoom-out",
      fromView,
      toView,
      reducedMotion: prefersReducedMotion(),
    });
  };

  const completeTransition = () => {
    setState((s) => ({ ...s, phase: "idle", isTransitioning: false }));
  };

  return (
    <TransitionContext.Provider
      value={{ state, startTransition, completeTransition }}
    >
      {children}
    </TransitionContext.Provider>
  );
};

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context)
    throw new Error("useTransition must be used within TransitionProvider");
  return context;
};
```

**Test**: Context provides state to consumers

#### Step 3.2: useViewTransition Hook (~3 hours)

Create hook for orchestrating view transitions.

**File**: `src/hooks/useViewTransition.ts`

```typescript
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTransition } from "../contexts/TransitionContext";
import { Point } from "../types/zoom-pan";

export const useViewTransition = () => {
  const navigate = useNavigate();
  const { state, startTransition, completeTransition } = useTransition();

  const transitionTo = useCallback(
    (path: string, clickPosition: Point, currentView: string) => {
      const targetView = path.split("/")[1] || "home";

      if (state.reducedMotion) {
        // Simple navigation without zoom effects
        navigate(path);
      } else {
        // Start zoom transition
        startTransition(clickPosition, currentView, targetView);

        // Navigate after zoom-out phase (300ms)
        setTimeout(() => {
          navigate(path);
          // Complete transition after zoom-in phase (300ms more)
          setTimeout(completeTransition, 300);
        }, 600);
      }
    },
    [navigate, state.reducedMotion, startTransition, completeTransition]
  );

  // Framer Motion variants for exits
  const exitVariant = {
    initial: { scale: 1, opacity: 1 },
    exit: state.reducedMotion
      ? { opacity: 0 }
      : {
          scale: 1.5,
          opacity: 0,
          transition: { duration: 0.6, ease: "easeInOut" },
        },
  };

  // Framer Motion variants for entries
  const enterVariant = {
    initial: state.reducedMotion ? { opacity: 0 } : { scale: 1.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.6, ease: "easeInOut" },
  };

  return {
    ...state,
    transitionTo,
    exitVariant,
    enterVariant,
  };
};
```

**Test**: Navigation triggers zoom transition sequence

#### Step 3.3: Apply Transitions to Views (~2 hours)

Wrap view components with Framer Motion and transition logic.

**File**: `src/pages/MasterPlanView.tsx` (example)

```typescript
import { motion } from "framer-motion";
import { useViewTransition } from "../hooks/useViewTransition";

const MasterPlanView = () => {
  const { transitionTo, exitVariant } = useViewTransition();

  const handleBuildingClick = (buildingId: string, e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const origin = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };

    transitionTo(`/building/${buildingId}`, origin, "masterplan");
  };

  return <motion.div {...exitVariant}>{/* content */}</motion.div>;
};
```

**Test**: Clicking buildings triggers zoom-through transition

### Phase 4: Testing & Polish (1-2 days)

#### Step 4.1: Accessibility Audit

- [ ] Keyboard-only navigation works
- [ ] Screen reader announces zoom levels
- [ ] Focus management during transitions
- [ ] Reduced motion preference respected
- [ ] Color contrast meets WCAG AA

#### Step 4.2: Performance Testing

- [ ] 30+ FPS during zoom/pan (use Performance Monitor)
- [ ] Transitions complete within 1 second
- [ ] No jank on mid-range devices
- [ ] Bundle size impact <10KB

#### Step 4.3: Browser Testing

- [ ] Chrome/Edge 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Testing Approach

### Manual Testing Checklist

1. **Zoom In/Out**

   - [ ] Mouse wheel zooms in/out centered on cursor
   - [ ] +/- keys zoom in/out
   - [ ] Pinch gesture zooms on mobile
   - [ ] Double-tap zooms to 2x, second tap resets

2. **Panning**

   - [ ] Click-and-drag pans when zoomed
   - [ ] Arrow keys pan when zoomed
   - [ ] Content stays partially visible (constrained)

3. **View Transitions**

   - [ ] Clicking building triggers zoom transition
   - [ ] Transition completes smoothly in ~0.8s
   - [ ] New view starts zoomed and zooms out
   - [ ] Reduced motion uses simple fade

4. **Master Plan Angles**

   - [ ] Zoomed master plan resets before angle change
   - [ ] Angle sequence plays after zoom reset

5. **Accessibility**
   - [ ] All controls work keyboard-only
   - [ ] Screen reader announces zoom changes
   - [ ] Focus visible at all times

### Automated Testing

Create unit tests for:

- `clamp`, `throttle`, `distance`, `constrainPan` utilities
- `useZoomPan` hook state transitions
- `useViewTransition` hook navigation logic

## Troubleshooting

### Issue: Zoom feels jittery

**Solution**: Ensure wheel handler is throttled to 16ms (60 FPS)

### Issue: Pan doesn't work

**Solution**: Check that `zoom > 1` before allowing pan, verify pointer events aren't blocked

### Issue: Interactive elements not clickable

**Solution**: Ensure `stopPropagation()` on hotspot click handlers, check z-index stacking

### Issue: Transitions don't trigger

**Solution**: Verify `TransitionProvider` wraps entire app, check console for errors

### Issue: Poor mobile performance

**Solution**: Use `passive: true` on touch listeners, ensure `will-change: transform` CSS hint

## Next Steps

After implementing this feature:

1. Run accessibility audit with axe DevTools
2. Performance test on real devices (not just emulators)
3. Gather user feedback on zoom speed and transition feel
4. Consider adding momentum/inertia to pan gestures (future enhancement)

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
- [CSS Transform Performance](https://web.dev/animations-guide/)
