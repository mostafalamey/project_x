/**
 * Coordinate Transform Utilities
 * Convert between screen coordinates and image coordinates for canvas drawing
 */

import type { Point } from "../types/admin-config";

// ============================================================================
// Screen to Image Coordinates
// ============================================================================

/**
 * Convert screen coordinates to image coordinates
 * @param screenX - X coordinate in viewport pixels
 * @param screenY - Y coordinate in viewport pixels
 * @param imageWidth - Native width of the image
 * @param imageHeight - Native height of the image
 * @param canvasScale - Current zoom scale (1 = 100%)
 * @param canvasOffset - Current pan offset {x, y}
 * @returns Point in image coordinate space
 */
export function screenToImageCoords(
  screenX: number,
  screenY: number,
  imageWidth: number,
  imageHeight: number,
  canvasScale: number,
  canvasOffset: Point
): Point {
  // Remove pan offset
  const adjustedX = screenX - canvasOffset.x;
  const adjustedY = screenY - canvasOffset.y;

  // Remove scale
  const imageX = adjustedX / canvasScale;
  const imageY = adjustedY / canvasScale;

  // Clamp to image bounds
  return {
    x: Math.max(0, Math.min(imageWidth, imageX)),
    y: Math.max(0, Math.min(imageHeight, imageY)),
  };
}

/**
 * Convert image coordinates to screen coordinates
 * @param imageX - X coordinate in image pixels
 * @param imageY - Y coordinate in image pixels
 * @param canvasScale - Current zoom scale (1 = 100%)
 * @param canvasOffset - Current pan offset {x, y}
 * @returns Point in screen coordinate space
 */
export function imageToScreenCoords(
  imageX: number,
  imageY: number,
  canvasScale: number,
  canvasOffset: Point
): Point {
  return {
    x: imageX * canvasScale + canvasOffset.x,
    y: imageY * canvasScale + canvasOffset.y,
  };
}

/**
 * Convert an array of points from screen to image coordinates
 */
export function screenPointsToImage(
  points: Point[],
  imageWidth: number,
  imageHeight: number,
  canvasScale: number,
  canvasOffset: Point
): Point[] {
  return points.map((p) =>
    screenToImageCoords(
      p.x,
      p.y,
      imageWidth,
      imageHeight,
      canvasScale,
      canvasOffset
    )
  );
}

/**
 * Convert an array of points from image to screen coordinates
 */
export function imagePointsToScreen(
  points: Point[],
  canvasScale: number,
  canvasOffset: Point
): Point[] {
  return points.map((p) =>
    imageToScreenCoords(p.x, p.y, canvasScale, canvasOffset)
  );
}

// ============================================================================
// Canvas Bounds and Constraints
// ============================================================================

/**
 * Calculate the visible area of the image in image coordinates
 */
export function getVisibleImageBounds(
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  canvasScale: number,
  canvasOffset: Point
): { left: number; top: number; right: number; bottom: number } {
  // Top-left corner of visible area
  const topLeft = screenToImageCoords(
    0,
    0,
    imageWidth,
    imageHeight,
    canvasScale,
    canvasOffset
  );

  // Bottom-right corner of visible area
  const bottomRight = screenToImageCoords(
    viewportWidth,
    viewportHeight,
    imageWidth,
    imageHeight,
    canvasScale,
    canvasOffset
  );

  return {
    left: topLeft.x,
    top: topLeft.y,
    right: bottomRight.x,
    bottom: bottomRight.y,
  };
}

/**
 * Calculate ideal scale to fit image within viewport
 */
export function getScaleToFit(
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  padding: number = 20
): number {
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;

  const scaleX = availableWidth / imageWidth;
  const scaleY = availableHeight / imageHeight;

  return Math.min(scaleX, scaleY, 1); // Never scale above 100%
}

/**
 * Calculate offset to center image in viewport at current scale
 */
export function getCenterOffset(
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  scale: number
): Point {
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;

  return {
    x: (viewportWidth - scaledWidth) / 2,
    y: (viewportHeight - scaledHeight) / 2,
  };
}

/**
 * Constrain offset to prevent image from going out of bounds
 */
export function constrainOffset(
  offset: Point,
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  scale: number,
  minVisiblePx: number = 100
): Point {
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;

  // Allow panning until only minVisiblePx of the image is visible
  const maxOffsetX = minVisiblePx;
  const minOffsetX = viewportWidth - scaledWidth - minVisiblePx;

  const maxOffsetY = minVisiblePx;
  const minOffsetY = viewportHeight - scaledHeight - minVisiblePx;

  return {
    x: Math.max(minOffsetX, Math.min(maxOffsetX, offset.x)),
    y: Math.max(minOffsetY, Math.min(maxOffsetY, offset.y)),
  };
}

// ============================================================================
// Mouse/Touch Event Helpers
// ============================================================================

/**
 * Get mouse position relative to canvas element
 */
export function getMousePos(
  event: MouseEvent | React.MouseEvent,
  canvasElement: HTMLElement
): Point {
  const rect = canvasElement.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

/**
 * Get touch position relative to canvas element
 */
export function getTouchPos(
  event: TouchEvent | React.TouchEvent,
  canvasElement: HTMLElement
): Point {
  const rect = canvasElement.getBoundingClientRect();
  const touch = event.touches[0] || event.changedTouches[0];
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate midpoint between two points
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}
