// Animation and math utility functions for zoom/pan

import type { Point, Bounds } from "../types/zoom-pan";

/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Throttle a function to max rate (ms)
 */
export const throttle = <T extends (...args: never[]) => void>(
  fn: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      fn(...args);
    }
  };
};

/**
 * Calculate distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Constrain pan to keep content partially visible
 */
export const constrainPan = (
  pan: Point,
  zoom: number,
  containerSize: Bounds,
  contentSize: Bounds
): Point => {
  const scaledWidth = contentSize.width * zoom;
  const scaledHeight = contentSize.height * zoom;

  const maxX = Math.max(0, (scaledWidth - containerSize.width) / 2);
  const maxY = Math.max(0, (scaledHeight - containerSize.height) / 2);

  return {
    x: clamp(pan.x, -maxX, maxX),
    y: clamp(pan.y, -maxY, maxY),
  };
};

/**
 * Calculate normalized coordinates (0-1) from pixel position
 */
export const normalizePoint = (point: Point, bounds: Bounds): Point => {
  return {
    x: point.x / bounds.width,
    y: point.y / bounds.height,
  };
};

/**
 * Calculate pixel coordinates from normalized (0-1) position
 */
export const denormalizePoint = (point: Point, bounds: Bounds): Point => {
  return {
    x: point.x * bounds.width,
    y: point.y * bounds.height,
  };
};
