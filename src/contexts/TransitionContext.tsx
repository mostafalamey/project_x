import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";

import type { ViewTransitionState } from "../types/zoom-pan";
import { prefersReducedMotion } from "../utils/accessibility";

// Route depth for determining navigation direction
const getRouteDepth = (pathname: string): number => {
  if (pathname === "/" || pathname === "") return 0;
  if (pathname.startsWith("/masterplan")) return 1;
  if (pathname.includes("/floor/")) return 3;
  if (pathname.startsWith("/building/")) return 2;
  if (pathname.startsWith("/tour/")) return 4;
  return 0;
};

interface TransitionContextValue {
  state: ViewTransitionState;
  direction: "forward" | "backward" | "none";
  startTransition: (toView: string, origin: { x: number; y: number }) => void;
  completeTransition: () => void;
}

const TransitionContext = createContext<TransitionContextValue | undefined>(
  undefined
);

export const useTransitionContext = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error(
      "useTransitionContext must be used within a TransitionProvider"
    );
  }
  return context;
};

interface TransitionProviderProps {
  children: React.ReactNode;
}

export const TransitionProvider: React.FC<TransitionProviderProps> = ({
  children,
}) => {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const prevDepthRef = useRef(getRouteDepth(location.pathname));

  const [state, setState] = useState<ViewTransitionState>({
    isTransitioning: false,
    origin: { x: 0.5, y: 0.5 },
    phase: "idle",
    fromView: undefined,
    toView: undefined,
    reducedMotion: prefersReducedMotion(),
  });

  // Calculate direction on-demand without state updates to avoid re-render issues
  const getDirection = (): "forward" | "backward" | "none" => {
    const currentDepth = getRouteDepth(location.pathname);
    const previousDepth = prevDepthRef.current;

    if (currentDepth > previousDepth) {
      return "forward";
    } else if (currentDepth < previousDepth) {
      return "backward";
    }
    return "none";
  };

  const direction = getDirection();

  // Update refs after render for next comparison
  useEffect(() => {
    const currentDepth = getRouteDepth(location.pathname);
    prevPathRef.current = location.pathname;
    prevDepthRef.current = currentDepth;
  }, [location.pathname, direction]);

  const startTransition = useCallback(
    (toView: string, origin: { x: number; y: number }) => {
      setState((prev) => ({
        ...prev,
        isTransitioning: true,
        origin,
        toView,
        fromView: prev.toView || undefined,
        phase: "zoom-out",
      }));
    },
    []
  );

  const completeTransition = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTransitioning: false,
      phase: "idle",
      fromView: undefined,
      toView: undefined,
    }));
  }, []);

  return (
    <TransitionContext.Provider
      value={{ state, direction, startTransition, completeTransition }}
    >
      {children}
    </TransitionContext.Provider>
  );
};
