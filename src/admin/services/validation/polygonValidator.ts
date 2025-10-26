/**
 * Polygon Validator
 * Validates polygon geometry for vertices, bounds, and topology
 */

import type { Point, PolygonGeometry } from "../../types/admin-config";
import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../../types/editor";

// ============================================================================
// Validation Constants
// ============================================================================

export const POLYGON_CONSTRAINTS = {
  MIN_VERTICES: 3,
  MAX_VERTICES: 100,
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate polygon geometry
 */
export function validatePolygon(
  polygon: PolygonGeometry,
  imageBounds?: { width: number; height: number }
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check minimum vertices
  if (polygon.vertices.length < POLYGON_CONSTRAINTS.MIN_VERTICES) {
    errors.push({
      field: "vertices",
      message: `Polygon must have at least ${POLYGON_CONSTRAINTS.MIN_VERTICES} vertices (got ${polygon.vertices.length})`,
      code: "INSUFFICIENT_VERTICES",
    });
  }

  // Check maximum vertices
  if (polygon.vertices.length > POLYGON_CONSTRAINTS.MAX_VERTICES) {
    errors.push({
      field: "vertices",
      message: `Polygon exceeds maximum ${POLYGON_CONSTRAINTS.MAX_VERTICES} vertices (got ${polygon.vertices.length})`,
      code: "TOO_MANY_VERTICES",
    });
  }

  // Check for valid coordinates
  const invalidVertices = polygon.vertices.filter(
    (v) => !isFinite(v.x) || !isFinite(v.y) || v.x < 0 || v.y < 0
  );

  if (invalidVertices.length > 0) {
    errors.push({
      field: "vertices",
      message: `${invalidVertices.length} vertices have invalid coordinates`,
      code: "INVALID_COORDINATES",
    });
  }

  // Check bounds if provided
  if (imageBounds && errors.length === 0) {
    const outOfBounds = polygon.vertices.filter(
      (v) => v.x > imageBounds.width || v.y > imageBounds.height
    );

    if (outOfBounds.length > 0) {
      errors.push({
        field: "vertices",
        message: `${outOfBounds.length} vertices are outside image bounds`,
        code: "OUT_OF_BOUNDS",
      });
    }
  }

  // Check for self-intersection (warning only)
  if (polygon.vertices.length >= 4 && isSelfIntersecting(polygon.vertices)) {
    warnings.push({
      field: "topology",
      message:
        "Polygon edges intersect each other. This may cause unexpected behavior.",
      code: "SELF_INTERSECTING",
    });
  }

  // Check for very small polygons (warning only)
  if (polygon.vertices.length >= 3) {
    const area = calculatePolygonArea(polygon.vertices);
    if (area < 100) {
      // Less than 100 square pixels
      warnings.push({
        field: "size",
        message: `Polygon area is very small (${area.toFixed(
          2
        )}px²). It may be difficult to click.`,
        code: "SMALL_AREA",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate that coordinates are within bounds
 */
export function validateCoordinatesBounds(
  points: Point[],
  bounds: { width: number; height: number }
): ValidationResult {
  const errors: ValidationError[] = [];

  const outOfBounds = points.filter(
    (p) => p.x < 0 || p.y < 0 || p.x > bounds.width || p.y > bounds.height
  );

  if (outOfBounds.length > 0) {
    errors.push({
      field: "coordinates",
      message: `${outOfBounds.length} points are outside bounds (0,0)-(${bounds.width},${bounds.height})`,
      code: "OUT_OF_BOUNDS",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Validate minimum distance between vertices
 */
export function validateVertexSpacing(
  vertices: Point[],
  minDistance: number = 5
): ValidationResult {
  const warnings: ValidationWarning[] = [];

  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    const dist = distance(current, next);

    if (dist < minDistance) {
      warnings.push({
        field: "vertices",
        message: `Vertices ${i} and ${
          (i + 1) % vertices.length
        } are very close (${dist.toFixed(1)}px). Consider merging them.`,
        code: "VERTICES_TOO_CLOSE",
      });
    }
  }

  return {
    isValid: true,
    errors: [],
    warnings,
  };
}

// ============================================================================
// Geometry Helper Functions
// ============================================================================

/**
 * Check if polygon is self-intersecting
 */
function isSelfIntersecting(vertices: Point[]): boolean {
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const a1 = vertices[i];
    const a2 = vertices[(i + 1) % n];

    for (let j = i + 2; j < n; j++) {
      // Skip adjacent edges
      if (j === (i + n - 1) % n || j === (i + 1) % n) continue;

      const b1 = vertices[j];
      const b2 = vertices[(j + 1) % n];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if two line segments intersect
 */
function segmentsIntersect(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): boolean {
  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }

  return false;
}

/**
 * Calculate direction of point c relative to line segment ab
 */
function direction(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/**
 * Calculate polygon area using shoelace formula
 */
function calculatePolygonArea(vertices: Point[]): number {
  let area = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % n];
    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area / 2);
}

/**
 * Calculate distance between two points
 */
function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Constrain point to bounds
 */
export function constrainToBounds(
  point: Point,
  bounds: { width: number; height: number }
): Point {
  return {
    x: Math.max(0, Math.min(bounds.width, point.x)),
    y: Math.max(0, Math.min(bounds.height, point.y)),
  };
}
