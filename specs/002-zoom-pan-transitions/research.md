# Research: Interactive Zoom, Pan, and View Transitions

**Feature**: 002-zoom-pan-transitions  
**Date**: 2025-10-23  
**Phase**: 0 - Research & Technology Selection

## Overview

This document consolidates research findings for implementing zoom/pan interactions and view transitions in a React-based static web application. Research covers zoom/pan patterns, animation approaches, accessibility considerations, and performance optimization techniques.

## Research Topics

### 1. Zoom/Pan Implementation Approaches

**Decision**: CSS Transform-based approach with React state management

**Rationale**:

- **CSS transforms** (`scale`, `translate`) are GPU-accelerated and provide 60 FPS performance on modern devices
- **React state + useEffect** provides predictable state management with Framer Motion for smooth animations
- **Native browser features** (wheel events, touch events) integrate cleanly without heavy dependencies
- Composable architecture allows reusable `useZoomPan` hook across all view types

**Alternatives Considered**:

1. **Canvas-based zoom** (e.g., Fabric.js, Konva)

   - Rejected: Overkill for static images; adds 200KB+ bundle size; complex integration with existing SVG floor plans

2. **Third-party zoom libraries** (e.g., react-pan-zoom, react-zoom-pan-pinch)

   - Rejected: Limited customization for view transitions; potential conflicts with existing Framer Motion animations; adds unnecessary abstractions

3. **Native browser zoom** (viewport meta tag manipulation)
   - Rejected: No programmatic control for transitions; conflicts with normal page zoom; poor UX on mobile

**Implementation Pattern**:

```typescript
// Hook-based state management
const useZoomPan = () => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Wheel handler with 1.1x multiplier
  const handleWheel = (e: WheelEvent) => {
    const delta = e.deltaY > 0 ? 1/1.1 : 1.1;
    setZoom(z => clamp(z * delta, 1, 5));
  };

  return { zoom, pan, handleWheel, ... };
};

// Render with CSS transforms
<div style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}>
  {content}
</div>
```

### 2. Animation Easing Functions

**Decision**: Use Framer Motion's built-in easing with `ease-out` for zoom/pan, `ease-in-out` for view transitions

**Rationale**:

- **Framer Motion already in project** - no additional dependencies
- **Industry-standard easing curves** matching iOS/Android/web best practices
- **Declarative animation API** integrates cleanly with React
- **Performance optimized** - uses CSS animations when possible, falls back to RAF

**Implementation**:

```typescript
import { motion } from 'framer-motion';

// Zoom/pan with ease-out
<motion.div
  animate={{ scale: zoom, x: pan.x, y: pan.y }}
  transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
>
  {content}
</motion.div>

// View transitions with ease-in-out
<AnimatePresence mode="wait">
  <motion.div
    key={viewId}
    initial={{ scale: 1.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 1.5, opacity: 0 }}
    transition={{ duration: 0.8, ease: 'easeInOut' }}
  >
    {viewContent}
  </motion.div>
</AnimatePresence>
```

**Alternatives Considered**:

1. **Custom easing with requestAnimationFrame**

   - Rejected: Reinventing the wheel; Framer Motion already optimized

2. **CSS transitions/animations only**

   - Rejected: No programmatic control during transitions; harder to coordinate view transitions

3. **Spring physics** (Framer Motion's `type: 'spring'`)
   - Rejected: Too bouncy for professional real estate UI; unpredictable duration

### 3. Panorama Zoom Integration

**Decision**: Use Photo Sphere Viewer's built-in `zoom` API with custom wheel handler

**Rationale**:

- **Photo Sphere Viewer 4.0** already in project for 360° tours
- **Native field of view (FOV) control** provides smooth panorama zoom
- **Consistent API** with static view zoom (wheel events, pinch gestures)
- **Performance optimized** by library for WebGL rendering

**Implementation**:

```typescript
const viewer = useRef<Viewer>();

const handlePanoramaZoom = (e: WheelEvent) => {
  e.preventDefault();
  const currentFov = viewer.current?.getZoomLevel() || 50;
  const delta = e.deltaY > 0 ? 5 : -5;
  const newFov = clamp(currentFov + delta, 30, 90);
  viewer.current?.zoom(newFov, 200); // Animate to new FOV over 200ms
};
```

**Alternatives Considered**:

1. **Replace panorama viewer with custom WebGL**

   - Rejected: Massive scope increase; Photo Sphere Viewer already performant

2. **Disable panorama zoom, static views only**
   - Rejected: User Story 3 explicitly requires panorama zoom capability

### 4. Accessibility Implementation

**Decision**: Add keyboard controls (+/- keys, Arrow keys for pan) and ARIA live regions

**Rationale**:

- **WCAG 2.1 Level AA compliance** requires keyboard alternatives for gesture-only interactions
- **Screen reader support** needed to announce zoom level changes
- **Focus management** during transitions prevents disorientation
- **Minimal code impact** - 50-100 LOC for full accessibility

**Implementation**:

```typescript
// Keyboard controls
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "+" || e.key === "=") {
    setZoom((z) => clamp(z * 1.1, 1, 5));
    announceZoom(zoom * 1.1);
  } else if (e.key === "-" || e.key === "_") {
    setZoom((z) => clamp(z / 1.1, 1, 5));
    announceZoom(zoom / 1.1);
  } else if (e.key === "ArrowUp") {
    setPan((p) => ({ ...p, y: p.y + 20 }));
  }
  // ... Arrow keys for pan
};

// ARIA live region
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {`Zoom level: ${Math.round(zoom * 100)}%`}
</div>;
```

**Standards Reference**:

- WCAG 2.1 Success Criterion 2.1.1 (Keyboard accessible)
- WCAG 2.1 Success Criterion 2.1.3 (No keyboard trap)
- ARIA 1.2 live regions for dynamic content announcements

**Alternatives Considered**:

1. **Gesture-only (original spec)**

   - Rejected: Fails WCAG 2.1 Level A; inaccessible to keyboard-only users

2. **Add visible +/- buttons**
   - Rejected: Spec clarified gesture-only for UI cleanliness; keyboard is non-visual alternative

### 5. View Transition Orchestration

**Decision**: Context-based transition state with `useViewTransition` hook

**Rationale**:

- **Centralized state** prevents race conditions during navigation
- **Context API** provides transition state to all views without prop drilling
- **Coordinate zoom origin** based on clicked element position
- **Respect reduced motion** via `prefers-reduced-motion` media query

**Implementation Pattern**:

```typescript
// Context for transition state
const TransitionContext = createContext({
  isTransitioning: false,
  transitionOrigin: { x: 0.5, y: 0.5 },
  startTransition: (origin: Point) => {},
});

// Hook for orchestrating transitions
const useViewTransition = () => {
  const navigate = useNavigate();
  const { startTransition } = useContext(TransitionContext);

  const transitionTo = (path: string, clickPosition: Point) => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      navigate(path); // Simple fade, no zoom
    } else {
      startTransition(clickPosition);
      setTimeout(() => navigate(path), 600); // Zoom-out phase
    }
  };

  return { transitionTo };
};
```

**Alternatives Considered**:

1. **Page-level state only**

   - Rejected: Tight coupling; harder to coordinate origin point across views

2. **React Router custom transitions**
   - Rejected: React Router 6 doesn't support transition callbacks; need custom solution

### 6. Performance Optimization Techniques

**Decision**: GPU compositing, throttled event handlers, will-change CSS hints

**Rationale**:

- **GPU compositing** (`transform`, `opacity`) avoids layout thrashing
- **Throttle wheel events** (16ms / 60 FPS) prevents jank from rapid scrolling
- **`will-change: transform`** hints browser to prepare GPU layer
- **Passive event listeners** for touch events improves scroll performance

**Implementation**:

```typescript
// Throttled wheel handler
const throttledWheel = useMemo(
  () => throttle(handleWheel, 16), // Max 60 FPS
  [handleWheel]
);

// CSS optimization
.zoom-pan-container {
  will-change: transform;
  transform: translateZ(0); /* Force GPU layer */
}

// Passive touch listeners
element.addEventListener('touchstart', handler, { passive: true });
```

**Performance Targets**:

- 30+ FPS during continuous zoom/pan (spec requirement)
- <200ms initial zoom response (spec requirement)
- <10KB additional bundle size (Framer Motion already included)
- No layout thrashing (use transforms, not width/height)

**Alternatives Considered**:

1. **No throttling**

   - Rejected: Causes jank on lower-end devices with rapid wheel scrolling

2. **Canvas rendering**
   - Rejected: Overkill; CSS transforms sufficient for image zoom

### 7. Master Plan Angle Transition Special Case

**Decision**: Pre-transition zoom reset for angle switches within master plan

**Rationale**:

- **Spec requirement FR-007a**: "Must first animate zoom out to default scale before performing angle transition sequence"
- **User orientation**: Prevents disorientation when angle sequence plays while zoomed into specific building
- **Smooth UX**: Sequential animation (zoom out → angle sequence) feels natural

**Implementation**:

```typescript
const handleAngleChange = (newAngle: number) => {
  if (zoom > 1) {
    // First animate zoom out to 1x
    setZoom(1);
    // Wait for zoom animation to complete, then play angle sequence
    setTimeout(() => playAngleSequence(newAngle), 300);
  } else {
    // Already at default zoom, play sequence immediately
    playAngleSequence(newAngle);
  }
};
```

### 8. Touch Gesture Detection

**Decision**: Native PointerEvent API with custom pinch detection

**Rationale**:

- **PointerEvent** unifies mouse, touch, and pen input
- **No dependencies** - native browser API with good support (Chrome 55+, Safari 13+)
- **Custom pinch calculation** for distance-based zoom (matches native feel)

**Implementation**:

```typescript
const [pointers, setPointers] = useState<Map<number, Point>>(new Map());

const handlePointerDown = (e: PointerEvent) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    initialPinchDistance = calculateDistance(Array.from(pointers.values()));
  }
};

const handlePointerMove = (e: PointerEvent) => {
  if (pointers.size === 2) {
    const currentDistance = calculateDistance(Array.from(pointers.values()));
    const scale = currentDistance / initialPinchDistance;
    setZoom((z) => clamp(z * scale, 1, 5));
  }
};
```

**Alternatives Considered**:

1. **Hammer.js or similar gesture library**

   - Rejected: 20KB+ bundle size; native API sufficient

2. **Touch events only (touchstart/touchmove)**
   - Rejected: Doesn't unify mouse and touch; more code

## Technology Stack Summary

| Technology          | Version | Purpose               | Already in Project? |
| ------------------- | ------- | --------------------- | ------------------- |
| React               | 18.3    | Component framework   | ✅ Yes              |
| TypeScript          | 5.x     | Type safety           | ✅ Yes              |
| Framer Motion       | 11.0    | Animations and easing | ✅ Yes              |
| React Router DOM    | 6.25    | Navigation/routing    | ✅ Yes              |
| Photo Sphere Viewer | 4.0     | Panorama rendering    | ✅ Yes              |

**New Dependencies**: None required

**New Utilities** (to be created):

- `src/hooks/useZoomPan.ts` (~150 LOC)
- `src/hooks/useViewTransition.ts` (~100 LOC)
- `src/components/ZoomPanContainer.tsx` (~80 LOC)
- `src/utils/animation.ts` (~50 LOC - throttle, clamp helpers)
- `src/utils/accessibility.ts` (~60 LOC - keyboard handlers, ARIA)

**Estimated Bundle Size Impact**: <10KB gzipped (no new dependencies, pure React/TypeScript)

## Best Practices Applied

### React Patterns

- **Custom Hooks**: Encapsulate zoom/pan logic for reusability
- **Context API**: Share transition state without prop drilling
- **Compound Components**: `ZoomPanContainer` wraps any view type
- **Ref forwarding**: Access DOM for event listeners and transforms

### Performance

- **Throttled Events**: Limit handler invocations to 60 FPS
- **GPU Acceleration**: Use `transform` and `opacity` only
- **Will-change hints**: Prepare browser for animations
- **Passive listeners**: Improve scroll performance

### Accessibility

- **Keyboard navigation**: +/- for zoom, arrows for pan, Escape to reset
- **ARIA live regions**: Announce zoom level changes
- **Focus management**: Trap and restore focus during transitions
- **Reduced motion**: Respect `prefers-reduced-motion` preference

### User Experience

- **Ease-out easing**: Natural feeling zoom/pan (fast start, slow finish)
- **1.1x zoom increment**: Smooth, controllable progression
- **Constrained pan**: Prevent image from leaving viewport
- **Reset on navigation**: Avoid disorientation between views

## Risk Assessment

| Risk                                   | Likelihood | Impact | Mitigation                                                                |
| -------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------- |
| Performance on low-end mobile          | Medium     | Medium | Throttle events, use GPU transforms, test on real devices                 |
| Browser compatibility (older Safari)   | Low        | Low    | PointerEvent has polyfills; fallback to mouse/touch events                |
| Accessibility compliance gap           | Low        | High   | Implement keyboard controls and ARIA in Phase 1, test with screen readers |
| Interaction conflicts with existing UI | Medium     | Medium | Careful event propagation, stopPropagation on hotspots                    |
| Transition timing coordination         | Medium     | Low    | Centralized state via Context, clear animation sequences                  |

## Open Questions / Future Considerations

1. **Double-tap zoom target**: Spec says "preset level (e.g., 2x)" - confirm 2x is appropriate

   - **Resolution**: 2x is standard on mobile platforms; proceed with this default

2. **Pan momentum**: Should pan have inertial scrolling (momentum) like native scroll?

   - **Deferred**: Not in spec; can add in future iteration if user feedback requests it

3. **Zoom origin for panorama**: Should panorama zoom center on view direction or screen center?

   - **Resolution**: Center on view direction (where user is looking) for natural feel

4. **Transition interruption**: What if user clicks during transition?
   - **Resolution**: Let current transition complete (600ms), queue next navigation

## Conclusion

All technical unknowns have been resolved. Implementation approach uses existing dependencies (Framer Motion, React, TypeScript) with custom hooks and utilities. No new external libraries required. Accessibility requirements added to Phase 1 to ensure WCAG 2.1 Level AA compliance. Ready to proceed to Phase 1: Design & Contracts.
