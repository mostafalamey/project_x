# Contracts: Interactive Zoom, Pan, and View Transitions

**Feature**: 002-zoom-pan-transitions  
**Date**: 2025-10-23

## Overview

This feature is purely client-side with no backend APIs, external services, or data schemas requiring contracts. All state is transient and managed in-memory within React components.

## Why No API Contracts?

This feature:

- Does not communicate with any backend services
- Does not persist data to storage (local or remote)
- Does not consume external APIs
- Does not modify or create JSON data files

All functionality runs entirely in the browser using:

- React state management
- Framer Motion for animations
- Native browser events (wheel, pointer, keyboard)
- Photo Sphere Viewer's existing API (already documented in feature 001)

## Internal Type Contracts

While there are no external API contracts, internal TypeScript interfaces serve as contracts between components:

**Location**: `src/types/zoom-pan.d.ts`

These types are documented in detail in [data-model.md](../data-model.md):

- `ZoomPanState` - Internal state shape
- `ViewTransitionState` - Transition orchestration state
- `PanoramaZoomState` - Panorama-specific zoom state
- `ZoomPanConfig` - Configuration options
- `TransitionConfig` - Transition behavior options

## Related Schemas

This feature does not modify any existing JSON schemas from feature 001:

- `building.schema.json` - Unchanged
- `floor.schema.json` - Unchanged
- `landmarks.schema.json` - Unchanged
- `masterplan.schema.json` - Unchanged
- `model.schema.json` - Unchanged
- `tour.schema.json` - Unchanged
- `unit.schema.json` - Unchanged

All zoom/pan and transition behavior is applied at the presentation layer without requiring data model changes.

## Component Contracts

### ZoomPanContainer Component

**Props Interface**:

```typescript
interface ZoomPanContainerProps {
  children: ReactNode;
  config?: ZoomPanConfig;
  className?: string;
}
```

**Contract**: Wraps any content and adds zoom/pan capabilities. Does not modify child components or their props.

### Hook Contracts

#### useZoomPan Hook

**Input**: `ZoomPanConfig` (optional)  
**Output**: State, handlers, and helpers for zoom/pan functionality

**Contract**: Hook manages its own state and does not mutate external state. All event handlers are safe to attach to DOM elements.

#### useViewTransition Hook

**Input**: None (consumes TransitionContext)  
**Output**: Transition state and navigation helper

**Contract**: Coordinates with React Router for navigation. Does not bypass router or manipulate browser history directly.

## Accessibility Contracts

**WCAG 2.1 Level AA Compliance Requirements**:

- **2.1.1 Keyboard**: All zoom/pan functions accessible via keyboard
- **2.1.3 Keyboard (No Trap)**: Focus can exit zoom/pan areas
- **4.1.3 Status Messages**: Zoom level changes announced to screen readers

These are tested manually and verified with accessibility tools (not API contracts).

## Performance Contracts

**Guaranteed Performance Targets** (per spec):

- 30+ FPS during zoom/pan animations
- < 200ms zoom response time
- 0.6-1.2s total transition duration
- < 10KB additional bundle size

These are measurable via Chrome DevTools Performance Monitor and bundle analysis tools.

## Conclusion

No traditional API contracts required. All interfaces are internal TypeScript types serving as component contracts. Feature is self-contained within the client-side codebase.
