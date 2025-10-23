// Keyboard interaction hook for zoom/pan

import { useEffect, useCallback } from "react";

interface UseKeyboardOptions {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPan: (dx: number, dy: number) => void;
  enabled?: boolean;
  panSpeed?: number;
  fastPanMultiplier?: number;
}

export const useKeyboard = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPan,
  enabled = true,
  panSpeed = 20,
  fastPanMultiplier = 2,
}: UseKeyboardOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const speed = event.shiftKey ? panSpeed * fastPanMultiplier : panSpeed;

      switch (event.key) {
        case "+":
        case "=":
          event.preventDefault();
          onZoomIn();
          break;

        case "-":
        case "_":
          event.preventDefault();
          onZoomOut();
          break;

        case "0":
          event.preventDefault();
          onResetZoom();
          break;

        case "ArrowUp":
          event.preventDefault();
          onPan(0, speed);
          break;

        case "ArrowDown":
          event.preventDefault();
          onPan(0, -speed);
          break;

        case "ArrowLeft":
          event.preventDefault();
          onPan(speed, 0);
          break;

        case "ArrowRight":
          event.preventDefault();
          onPan(-speed, 0);
          break;

        default:
          break;
      }
    },
    [
      enabled,
      panSpeed,
      fastPanMultiplier,
      onZoomIn,
      onZoomOut,
      onResetZoom,
      onPan,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return null;
};
