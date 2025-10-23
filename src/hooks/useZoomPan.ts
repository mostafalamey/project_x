// Core zoom and pan state management hook

import { useState, useCallback, useRef, useEffect } from "react";

import type {
  ZoomPanState,
  ZoomPanConfig,
  Point,
  Bounds,
} from "../types/zoom-pan";
import { announceZoom } from "../utils/accessibility";
import { clamp, constrainPan } from "../utils/animation";

const DEFAULT_CONFIG: ZoomPanConfig = {
  minZoom: 1,
  maxZoom: 5,
  zoomIncrement: 1.1,
  animationDuration: 300,
  easing: "easeOut",
  keyboardEnabled: true,
  constrainPan: true,
};

export const useZoomPan = (
  containerSize: Bounds,
  contentSize: Bounds,
  config: Partial<ZoomPanConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<ZoomPanState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    isInteracting: false,
    origin: { x: 0, y: 0 },
  });

  const lastAnnouncedZoom = useRef<number>(1);

  // Zoom to a specific level with optional origin point
  const zoomTo = useCallback(
    (newZoom: number, origin?: Point) => {
      const clampedZoom = clamp(
        newZoom,
        finalConfig.minZoom,
        finalConfig.maxZoom
      );

      setState((prev) => {
        let newPan = prev.pan;

        // Adjust pan to zoom around origin point
        if (origin) {
          const zoomDelta = clampedZoom / prev.zoom;
          newPan = {
            x: origin.x + (prev.pan.x - origin.x) * zoomDelta,
            y: origin.y + (prev.pan.y - origin.y) * zoomDelta,
          };
        }

        // Constrain pan if enabled
        if (finalConfig.constrainPan) {
          newPan = constrainPan(
            newPan,
            clampedZoom,
            containerSize,
            contentSize
          );
        }

        return {
          ...prev,
          zoom: clampedZoom,
          pan: newPan,
          origin: origin || prev.origin,
        };
      });

      // Announce zoom change if significant (avoid spamming on scroll)
      if (Math.abs(clampedZoom - lastAnnouncedZoom.current) >= 0.2) {
        announceZoom(clampedZoom);
        lastAnnouncedZoom.current = clampedZoom;
      }
    },
    [
      finalConfig.minZoom,
      finalConfig.maxZoom,
      finalConfig.constrainPan,
      containerSize,
      contentSize,
    ]
  );

  // Zoom in by increment
  const zoomIn = useCallback(
    (origin?: Point) => {
      zoomTo(state.zoom * finalConfig.zoomIncrement, origin);
    },
    [state.zoom, finalConfig.zoomIncrement, zoomTo]
  );

  // Zoom out by increment
  const zoomOut = useCallback(
    (origin?: Point) => {
      zoomTo(state.zoom / finalConfig.zoomIncrement, origin);
    },
    [state.zoom, finalConfig.zoomIncrement, zoomTo]
  );

  // Reset to default zoom
  const resetZoom = useCallback(() => {
    setState({
      zoom: 1,
      pan: { x: 0, y: 0 },
      isInteracting: false,
      origin: { x: 0, y: 0 },
    });
    announceZoom(1);
    lastAnnouncedZoom.current = 1;
  }, []);

  // Pan by delta
  const panBy = useCallback(
    (delta: Point) => {
      setState((prev) => {
        let newPan = {
          x: prev.pan.x + delta.x,
          y: prev.pan.y + delta.y,
        };

        if (finalConfig.constrainPan) {
          newPan = constrainPan(newPan, prev.zoom, containerSize, contentSize);
        }

        return {
          ...prev,
          pan: newPan,
        };
      });
    },
    [finalConfig.constrainPan, containerSize, contentSize]
  );

  // Set pan to absolute position
  const panTo = useCallback(
    (position: Point) => {
      setState((prev) => {
        let newPan = position;

        if (finalConfig.constrainPan) {
          newPan = constrainPan(newPan, prev.zoom, containerSize, contentSize);
        }

        return {
          ...prev,
          pan: newPan,
        };
      });
    },
    [finalConfig.constrainPan, containerSize, contentSize]
  );

  // Set interaction state
  const setInteracting = useCallback((isInteracting: boolean) => {
    setState((prev) => ({ ...prev, isInteracting }));
  }, []);

  // Constrain pan when container or content size changes
  useEffect(() => {
    if (finalConfig.constrainPan && state.zoom > 1) {
      setState((prev) => ({
        ...prev,
        pan: constrainPan(prev.pan, prev.zoom, containerSize, contentSize),
      }));
    }
  }, [containerSize, contentSize, finalConfig.constrainPan, state.zoom]);

  return {
    state,
    zoomTo,
    zoomIn,
    zoomOut,
    resetZoom,
    panBy,
    panTo,
    setInteracting,
    config: finalConfig,
  };
};
