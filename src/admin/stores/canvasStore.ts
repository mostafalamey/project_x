/**
 * Canvas Store
 * Manages canvas UI state (zoom, pan, selection, drawing)
 */

import { create } from "zustand";
import type { Point } from "../types/admin-config";
import type { Tool } from "../types/canvas";

// ============================================================================
// Store Interface
// ============================================================================

interface CanvasStore {
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
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Initial state
  scale: 1.0,
  offset: { x: 0, y: 0 },
  selectedShapeId: null,
  hoveredShapeId: null,
  isDrawing: false,
  currentTool: "select",
  tempPoints: [],

  // Set zoom scale
  setScale: (scale: number) => {
    set({ scale: Math.max(0.1, Math.min(5, scale)) });
  },

  // Set pan offset
  setOffset: (offset: Point) => {
    set({ offset });
  },

  // Select shape
  selectShape: (id: string | null) => {
    set({ selectedShapeId: id });
  },

  // Set hovered shape
  setHoveredShape: (id: string | null) => {
    set({ hoveredShapeId: id });
  },

  // Set current tool
  setTool: (tool: Tool) => {
    set({
      currentTool: tool,
      selectedShapeId: null,
      isDrawing: false,
      tempPoints: [],
    });
  },

  // Start drawing operation
  startDrawing: () => {
    set({ isDrawing: true, tempPoints: [] });
  },

  // Add point while drawing
  addPoint: (point: Point) => {
    set((state) => ({
      tempPoints: [...state.tempPoints, point],
    }));
  },

  // Finish drawing operation
  finishDrawing: () => {
    set({ isDrawing: false, tempPoints: [] });
  },

  // Cancel drawing operation
  cancelDrawing: () => {
    set({ isDrawing: false, tempPoints: [], currentTool: "select" });
  },

  // Reset canvas to default state
  resetCanvas: () => {
    set({
      scale: 1.0,
      offset: { x: 0, y: 0 },
      selectedShapeId: null,
      hoveredShapeId: null,
      isDrawing: false,
      currentTool: "select",
      tempPoints: [],
    });
  },
}));
