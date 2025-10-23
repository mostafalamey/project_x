import { useCallback, useRef, useState } from "react";

interface UseModelRotationOptions {
  frameCount: number;
  initialFrame?: number;
  sensitivity?: number; // pixels per frame (default: 30)
}

interface UseModelRotationReturn {
  currentFrame: number;
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
  };
  incrementFrame: () => void;
  decrementFrame: () => void;
  setFrame: (frame: number) => void;
}

/**
 * Hook to handle model rotation based on pointer drag/swipe gestures.
 * Tracks cumulative drag distance and maps it to frame increments/decrements.
 * Swipe left (negative delta) = rotate clockwise (increment frame)
 * Swipe right (positive delta) = rotate counter-clockwise (decrement frame)
 */
export const useModelRotation = ({
  frameCount,
  initialFrame = 0,
  sensitivity = 30,
}: UseModelRotationOptions): UseModelRotationReturn => {
  const [currentFrame, setCurrentFrame] = useState(initialFrame % frameCount);

  const isDragging = useRef(false);
  const lastX = useRef(0);
  const accumulatedDelta = useRef(0);

  // Wrap frame index to stay within bounds (circular)
  const wrapFrame = useCallback(
    (frame: number): number => {
      const wrapped = frame % frameCount;
      return wrapped < 0 ? wrapped + frameCount : wrapped;
    },
    [frameCount]
  );

  const incrementFrame = useCallback(() => {
    setCurrentFrame((prev) => wrapFrame(prev + 1));
  }, [wrapFrame]);

  const decrementFrame = useCallback(() => {
    setCurrentFrame((prev) => wrapFrame(prev - 1));
  }, [wrapFrame]);

  const setFrame = useCallback(
    (frame: number) => {
      setCurrentFrame(wrapFrame(frame));
    },
    [wrapFrame]
  );

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    // Only left mouse button or touch
    if (event.button !== 0) return;

    isDragging.current = true;
    lastX.current = event.clientX;
    accumulatedDelta.current = 0;

    // Prevent text selection and image dragging
    event.preventDefault();
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = event.clientX - lastX.current;
      lastX.current = event.clientX;

      // Accumulate delta
      accumulatedDelta.current += deltaX;

      // Calculate how many frames to change
      const framesToChange = Math.floor(
        Math.abs(accumulatedDelta.current) / sensitivity
      );

      if (framesToChange > 0) {
        const direction = accumulatedDelta.current > 0 ? -1 : 1; // Right swipe = decrement, left swipe = increment

        setCurrentFrame((prev) => wrapFrame(prev + direction * framesToChange));

        // Reset accumulated delta, keeping the remainder
        accumulatedDelta.current = accumulatedDelta.current % sensitivity;
      }
    },
    [sensitivity, wrapFrame]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;
    accumulatedDelta.current = 0;
  }, []);

  const handlePointerCancel = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;
    accumulatedDelta.current = 0;
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
    }
  }, []);

  return {
    currentFrame,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onContextMenu: handleContextMenu,
    },
    incrementFrame,
    decrementFrame,
    setFrame,
  };
};
