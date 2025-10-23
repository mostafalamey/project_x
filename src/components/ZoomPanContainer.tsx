// Container component that wraps content with zoom/pan capabilities

import { motion, useAnimation } from "framer-motion";
import React, { useRef, useCallback, useEffect, useState } from "react";

import { useKeyboard } from "../hooks/useKeyboard";
import { useZoomPan } from "../hooks/useZoomPan";
import type { ZoomPanConfig, Bounds } from "../types/zoom-pan";
import { throttle } from "../utils/animation";

interface ZoomPanContainerProps {
  children: React.ReactNode;
  className?: string;
  config?: Partial<ZoomPanConfig>;
  contentSize?: Bounds;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (x: number, y: number) => void;
}

export const ZoomPanContainer: React.FC<ZoomPanContainerProps> = ({
  children,
  className = "",
  config,
  contentSize,
  onZoomChange,
  onPanChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const [containerSize, setContainerSize] = useState<Bounds>({
    width: 0,
    height: 0,
  });
  const [finalContentSize, setFinalContentSize] = useState<Bounds>(
    contentSize || { width: 0, height: 0 }
  );

  // Measure container and content size
  useEffect(() => {
    const updateSizes = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }

      if (!contentSize && contentRef.current) {
        setFinalContentSize({
          width: contentRef.current.scrollWidth,
          height: contentRef.current.scrollHeight,
        });
      }
    };

    updateSizes();

    const resizeObserver = new ResizeObserver(updateSizes);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (contentRef.current && !contentSize) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [contentSize]);

  // Update content size from prop
  useEffect(() => {
    if (contentSize) {
      setFinalContentSize(contentSize);
    }
  }, [contentSize]);

  const {
    state,
    zoomIn,
    zoomOut,
    resetZoom,
    panBy,
    setInteracting,
    config: finalConfig,
  } = useZoomPan(containerSize, finalContentSize, config);

  // Notify parent of changes
  useEffect(() => {
    onZoomChange?.(state.zoom);
  }, [state.zoom, onZoomChange]);

  useEffect(() => {
    onPanChange?.(state.pan.x, state.pan.y);
  }, [state.pan.x, state.pan.y, onPanChange]);

  // Animate to current state
  useEffect(() => {
    controls.start({
      scale: state.zoom,
      x: state.pan.x,
      y: state.pan.y,
      transition: {
        duration: state.isInteracting
          ? 0
          : finalConfig.animationDuration / 1000,
        ease: finalConfig.easing,
      },
    });
  }, [
    state.zoom,
    state.pan.x,
    state.pan.y,
    state.isInteracting,
    finalConfig.animationDuration,
    finalConfig.easing,
    controls,
  ]);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const originX = event.clientX - rect.left - rect.width / 2;
      const originY = event.clientY - rect.top - rect.height / 2;

      if (event.deltaY < 0) {
        zoomIn({ x: originX, y: originY });
      } else {
        zoomOut({ x: originX, y: originY });
      }
    },
    [zoomIn, zoomOut]
  );

  // Handle mouse drag pan
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (state.zoom <= 1) return;

      event.preventDefault();
      setInteracting(true);
      dragStart.current = { x: event.clientX, y: event.clientY };
    },
    [state.zoom, setInteracting]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragStart.current) return;

      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;

      panBy({ x: dx, y: dy });
      dragStart.current = { x: event.clientX, y: event.clientY };
    },
    [panBy]
  );

  const handleMouseUp = useCallback(() => {
    if (dragStart.current) {
      setInteracting(false);
      dragStart.current = null;
    }
  }, [setInteracting]);

  // Handle keyboard
  useKeyboard({
    onZoomIn: () => zoomIn(),
    onZoomOut: () => zoomOut(),
    onResetZoom: resetZoom,
    onPan: (dx, dy) => panBy({ x: dx, y: dy }),
    enabled: finalConfig.keyboardEnabled,
  });

  // Setup wheel and mouse listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const throttledWheel = throttle(handleWheel, 50);
    container.addEventListener("wheel", throttledWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", throttledWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    if (!dragStart.current) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: "none" }}
      role="img"
      aria-label="Zoomable and pannable content. Use plus/minus keys to zoom, arrow keys to pan."
    >
      <motion.div
        ref={contentRef}
        animate={controls}
        onMouseDown={handleMouseDown}
        style={{
          cursor:
            state.zoom > 1
              ? state.isInteracting
                ? "grabbing"
                : "grab"
              : "default",
          transformOrigin: "center center",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
