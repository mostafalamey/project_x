/**
 * Canvas Types
 * Types for canvas state management and drawing operations
 */

import { Point } from "./admin-config";

// ============================================================================
// Canvas State
// ============================================================================

export interface CanvasState {
  scale: number; // Zoom level (1.0 = 100%)
  offset: Point; // Pan offset in pixels
  selectedShapeId: string | null; // Currently selected shape
  hoveredShapeId: string | null; // Shape under cursor
  isDrawing: boolean; // Drawing operation in progress
  tempPoints: Point[]; // Temporary points while drawing
}

// ============================================================================
// Drawing Modes
// ============================================================================

export type DrawingMode =
  | "none"
  | "poi" // Draw POI circle marker
  | "complex" // Draw Main Complex polygon
  | "path" // Draw SVG path
  | "building-hotspot" // Draw building hotspot on angle
  | "floor-hotspot" // Draw floor hotspot on building
  | "unit-hotspot"; // Draw unit hotspot on floor plan

// ============================================================================
// Canvas Tools
// ============================================================================

export type Tool =
  | "select" // Selection/edit mode
  | "polygon" // Polygon drawing tool
  | "circle" // Circle marker tool
  | "path" // Path drawing tool
  | "pan" // Pan canvas
  | "zoom"; // Zoom canvas

// ============================================================================
// Shape Data
// ============================================================================

export interface ShapeData {
  id: string;
  type: "polygon" | "circle" | "path" | "image";
  visible: boolean;
  selectable: boolean;
  draggable: boolean;
  zIndex: number;
}

export interface PolygonShapeData extends ShapeData {
  type: "polygon";
  points: number[]; // Flat array: [x1, y1, x2, y2, ...]
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  closed: boolean;
}

export interface CircleShapeData extends ShapeData {
  type: "circle";
  x: number;
  y: number;
  radius: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface PathShapeData extends ShapeData {
  type: "path";
  pathData: string; // SVG path d attribute
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface ImageShapeData extends ShapeData {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement | undefined;
  url: string;
}

export type AnyShapeData =
  | PolygonShapeData
  | CircleShapeData
  | PathShapeData
  | ImageShapeData;

// ============================================================================
// Canvas Events
// ============================================================================

export interface CanvasEventData {
  point: Point; // Canvas coordinates
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export interface VertexDragEvent {
  shapeId: string;
  vertexIndex: number;
  newPosition: Point;
}

// ============================================================================
// Viewport
// ============================================================================

export interface Viewport {
  width: number;
  height: number;
  imageWidth: number; // Native image dimensions
  imageHeight: number;
  scale: number; // Image scale to fit viewport
  offsetX: number; // Image offset in viewport
  offsetY: number;
}
