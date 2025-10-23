import { useCallback, useRef } from "react";

import type { Point } from "../types/zoom-pan";

interface UsePointerPanOptions {
  enabled?: boolean;
  onPanStart?: () => void;
  onPan?: (delta: Point) => void;
  onPanEnd?: () => void;
}

/**
 * Hook to handle pointer-based panning (mouse drag or touch)
 */
export const usePointerPan = (options: UsePointerPanOptions) => {
  const { enabled = true, onPanStart, onPan, onPanEnd } = options;

  const isDragging = useRef(false);
  const lastPosition = useRef<Point>({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) return;

      // Only left mouse button or touch
      if (event.button !== 0) return;

      isDragging.current = true;
      lastPosition.current = { x: event.clientX, y: event.clientY };

      // Prevent text selection during drag
      event.preventDefault();

      onPanStart?.();
    },
    [enabled, onPanStart]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled || !isDragging.current) return;

      const delta = {
        x: event.clientX - lastPosition.current.x,
        y: event.clientY - lastPosition.current.y,
      };

      lastPosition.current = { x: event.clientX, y: event.clientY };

      onPan?.(delta);
    },
    [enabled, onPan]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;
    onPanEnd?.();
  }, [onPanEnd]);

  const handlePointerCancel = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;
    onPanEnd?.();
  }, [onPanEnd]);

  return {
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      // Prevent context menu on right-click during pan
      onContextMenu: (e: React.MouseEvent) => {
        if (isDragging.current) {
          e.preventDefault();
        }
      },
    },
    isDragging: isDragging.current,
  };
};
