/**
 * useCanvas Hook
 * Manages canvas state and provides helper functions for zoom, pan, and coordinate transforms
 */

import { useCallback, useRef } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import {
  screenToImageCoords,
  imageToScreenCoords,
  getScaleToFit,
  getCenterOffset,
  constrainOffset,
  distance,
} from "../utils/coordinateTransform";
import type { Point } from "../types/admin-config";
import type { Tool } from "../types/canvas";

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseCanvasReturn {
  // State
  scale: number;
  offset: Point;
  selectedShapeId: string | null;
  hoveredShapeId: string | null;
  isDrawing: boolean;
  currentTool: Tool;
  tempPoints: Point[];

  // Actions
  setScale: (scale: number) => void;
  setOffset: (offset: Point) => void;
  selectShape: (id: string | null) => void;
  setHoveredShape: (id: string | null) => void;
  setTool: (tool: Tool) => void;
  startDrawing: () => void;
  addPoint: (point: Point) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  resetCanvas: () => void;

  // Helpers
  screenToImage: (
    screenX: number,
    screenY: number,
    imageWidth: number,
    imageHeight: number
  ) => Point;
  imageToScreen: (imageX: number, imageY: number) => Point;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (
    viewportWidth: number,
    viewportHeight: number,
    imageWidth: number,
    imageHeight: number
  ) => void;
  panBy: (
    dx: number,
    dy: number,
    viewportWidth: number,
    viewportHeight: number,
    imageWidth: number,
    imageHeight: number
  ) => void;
  centerImage: (
    viewportWidth: number,
    viewportHeight: number,
    imageWidth: number,
    imageHeight: number
  ) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCanvas(): UseCanvasReturn {
  const store = useCanvasStore();
  const lastPanPos = useRef<Point | null>(null);

  // Zoom helpers
  const zoomIn = useCallback(() => {
    const newScale = Math.min(store.scale * 1.2, 5);
    store.setScale(newScale);
  }, [store]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(store.scale / 1.2, 0.1);
    store.setScale(newScale);
  }, [store]);

  const zoomToFit = useCallback(
    (
      viewportWidth: number,
      viewportHeight: number,
      imageWidth: number,
      imageHeight: number
    ) => {
      const fitScale = getScaleToFit(
        viewportWidth,
        viewportHeight,
        imageWidth,
        imageHeight
      );
      const fitOffset = getCenterOffset(
        viewportWidth,
        viewportHeight,
        imageWidth,
        imageHeight,
        fitScale
      );
      store.setScale(fitScale);
      store.setOffset(fitOffset);
    },
    [store]
  );

  // Pan helpers
  const panBy = useCallback(
    (
      dx: number,
      dy: number,
      viewportWidth: number,
      viewportHeight: number,
      imageWidth: number,
      imageHeight: number
    ) => {
      const newOffset = {
        x: store.offset.x + dx,
        y: store.offset.y + dy,
      };

      const constrained = constrainOffset(
        newOffset,
        viewportWidth,
        viewportHeight,
        imageWidth,
        imageHeight,
        store.scale
      );

      store.setOffset(constrained);
    },
    [store]
  );

  const centerImage = useCallback(
    (
      viewportWidth: number,
      viewportHeight: number,
      imageWidth: number,
      imageHeight: number
    ) => {
      const centerOffset = getCenterOffset(
        viewportWidth,
        viewportHeight,
        imageWidth,
        imageHeight,
        store.scale
      );
      store.setOffset(centerOffset);
    },
    [store]
  );

  // Coordinate transform helpers
  const screenToImage = useCallback(
    (
      screenX: number,
      screenY: number,
      imageWidth: number,
      imageHeight: number
    ): Point => {
      return screenToImageCoords(
        screenX,
        screenY,
        imageWidth,
        imageHeight,
        store.scale,
        store.offset
      );
    },
    [store.scale, store.offset]
  );

  const imageToScreen = useCallback(
    (imageX: number, imageY: number): Point => {
      return imageToScreenCoords(imageX, imageY, store.scale, store.offset);
    },
    [store.scale, store.offset]
  );

  return {
    // State
    scale: store.scale,
    offset: store.offset,
    selectedShapeId: store.selectedShapeId,
    hoveredShapeId: store.hoveredShapeId,
    isDrawing: store.isDrawing,
    currentTool: store.currentTool,
    tempPoints: store.tempPoints,

    // Actions
    setScale: store.setScale,
    setOffset: store.setOffset,
    selectShape: store.selectShape,
    setHoveredShape: store.setHoveredShape,
    setTool: store.setTool,
    startDrawing: store.startDrawing,
    addPoint: store.addPoint,
    finishDrawing: store.finishDrawing,
    cancelDrawing: store.cancelDrawing,
    resetCanvas: store.resetCanvas,

    // Helpers
    screenToImage,
    imageToScreen,
    zoomIn,
    zoomOut,
    zoomToFit,
    panBy,
    centerImage,
  };
}
