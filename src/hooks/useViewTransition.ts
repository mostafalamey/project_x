// View transition state management hook

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import type { ViewTransitionState } from "../types/zoom-pan";
import { prefersReducedMotion } from "../utils/accessibility";

interface UseViewTransitionOptions {
  enabled?: boolean;
  zoomOutDuration?: number;
  fadeDuration?: number;
  zoomInDuration?: number;
}

const DEFAULT_OPTIONS: UseViewTransitionOptions = {
  enabled: true,
  zoomOutDuration: 400,
  fadeDuration: 200,
  zoomInDuration: 400,
};

export const useViewTransition = (
  currentView: string,
  options: UseViewTransitionOptions = {}
) => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const navigate = useNavigate();

  const [state, setState] = useState<ViewTransitionState>({
    isTransitioning: false,
    origin: { x: 0.5, y: 0.5 },
    phase: "idle",
    fromView: undefined,
    toView: undefined,
    reducedMotion: prefersReducedMotion(),
  });

  // Update reduced motion preference on media query change
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => {
      setState((prev) => ({ ...prev, reducedMotion: mediaQuery.matches }));
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Initiate transition to a new view
  const transitionTo = useCallback(
    (toView: string, origin = { x: 0.5, y: 0.5 }) => {
      if (!finalOptions.enabled || state.reducedMotion) {
        // Skip transition animation
        navigate(toView);
        return;
      }

      setState({
        isTransitioning: true,
        origin,
        phase: "zoom-out",
        fromView: currentView,
        toView,
        reducedMotion: state.reducedMotion,
      });
    },
    [finalOptions.enabled, state.reducedMotion, currentView, navigate]
  );

  // Progress through transition phases
  useEffect(() => {
    if (!state.isTransitioning) return;

    let timeoutId: number;

    switch (state.phase) {
      case "zoom-out":
        // After zoom out, fade
        timeoutId = window.setTimeout(() => {
          setState((prev) => ({ ...prev, phase: "fading" }));
        }, finalOptions.zoomOutDuration);
        break;

      case "fading":
        // After fade, navigate and zoom in
        timeoutId = window.setTimeout(() => {
          if (state.toView) {
            navigate(state.toView);
          }
          setState((prev) => ({ ...prev, phase: "zoom-in" }));
        }, finalOptions.fadeDuration);
        break;

      case "zoom-in":
        // After zoom in, complete
        timeoutId = window.setTimeout(() => {
          setState((prev) => ({ ...prev, phase: "complete" }));
        }, finalOptions.zoomInDuration);
        break;

      case "complete":
        // Reset to idle
        setState({
          isTransitioning: false,
          origin: { x: 0.5, y: 0.5 },
          phase: "idle",
          fromView: undefined,
          toView: undefined,
          reducedMotion: state.reducedMotion,
        });
        break;

      default:
        break;
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    state.isTransitioning,
    state.phase,
    state.toView,
    state.reducedMotion,
    finalOptions.zoomOutDuration,
    finalOptions.fadeDuration,
    finalOptions.zoomInDuration,
    navigate,
  ]);

  // Cancel ongoing transition
  const cancelTransition = useCallback(() => {
    setState({
      isTransitioning: false,
      origin: { x: 0.5, y: 0.5 },
      phase: "idle",
      fromView: undefined,
      toView: undefined,
      reducedMotion: state.reducedMotion,
    });
  }, [state.reducedMotion]);

  return {
    state,
    transitionTo,
    cancelTransition,
  };
};
