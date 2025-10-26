/**
 * Export Utilities
 * Functions for exporting admin data to viewer-compatible formats
 */

import type {
  Landmark,
  LandmarkPath,
  CircleGeometry,
  PolygonGeometry,
} from "../types/admin-config";

// ============================================================================
// Types for Viewer Format
// ============================================================================

interface ViewerLandmarkPOI {
  id: string;
  name: string;
  category?: string;
  description?: string;
  image?: string;
  distanceK?: number;
  timeMin?: number;
  coords: {
    x: number;
    y: number;
  };
  path?: number[];
  pathStyle?: {
    stroke?: string;
    strokeWidth?: number;
  };
  type: "poi";
}

interface ViewerLandmarkComplex {
  id: string;
  name: string;
  description?: string;
  image?: string;
  coords: number[];
  type: "complex";
}

type ViewerLandmark = ViewerLandmarkPOI | ViewerLandmarkComplex;

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate landmarks and paths before export
 */
export function validateLandmarks(
  landmarks: Landmark[],
  paths: LandmarkPath[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for exactly one complex landmark
  const complexLandmarks = landmarks.filter((l) => l.type === "complex");
  if (complexLandmarks.length === 0) {
    errors.push("No Main Complex landmark found. At least one is required.");
  } else if (complexLandmarks.length > 1) {
    errors.push("Multiple Main Complex landmarks found. Only one is allowed.");
  }

  // Check for at least one POI
  const poiLandmarks = landmarks.filter((l) => l.type === "poi");
  if (poiLandmarks.length === 0) {
    warnings.push("No POI landmarks found. Consider adding at least one.");
  }

  // Validate POI landmarks use CircleGeometry
  poiLandmarks.forEach((poi) => {
    if (poi.geometry.type !== "circle") {
      errors.push(
        `POI "${poi.name}" does not use CircleGeometry. POIs must be circles.`
      );
    }

    // Check required metadata
    if (!poi.metadata?.category) {
      warnings.push(`POI "${poi.name}" is missing a category.`);
    }
  });

  // Validate complex landmarks use PolygonGeometry
  complexLandmarks.forEach((complex) => {
    if (complex.geometry.type !== "polygon") {
      errors.push(
        `Complex "${complex.name}" does not use PolygonGeometry. Complex landmarks must be polygons.`
      );
    }

    const geometry = complex.geometry as PolygonGeometry;
    if (geometry.vertices && geometry.vertices.length < 3) {
      errors.push(
        `Complex "${complex.name}" has fewer than 3 vertices. Polygons need at least 3 points.`
      );
    }
  });

  // Validate paths
  paths.forEach((path) => {
    const fromLandmark = landmarks.find((l) => l.id === path.fromLandmarkId);
    const toLandmark = landmarks.find((l) => l.id === path.toLandmarkId);

    if (!fromLandmark) {
      errors.push(`Path references missing landmark: ${path.fromLandmarkId}`);
    }

    if (!toLandmark) {
      errors.push(`Path references missing landmark: ${path.toLandmarkId}`);
    }

    if (fromLandmark && fromLandmark.type !== "complex") {
      errors.push(
        `Path from "${fromLandmark.name}" is invalid. Paths must start from Complex landmarks.`
      );
    }

    if (toLandmark && toLandmark.type !== "poi") {
      errors.push(
        `Path to "${toLandmark.name}" is invalid. Paths must end at POI landmarks.`
      );
    }
  });

  // Check for POIs without paths
  poiLandmarks.forEach((poi) => {
    const hasPath = paths.some((p) => p.toLandmarkId === poi.id);
    if (!hasPath) {
      warnings.push(
        `POI "${poi.name}" has no path connecting it to the Main Complex.`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Convert admin landmarks to viewer format
 */
export function exportLandmarksToViewerFormat(
  landmarks: Landmark[],
  paths: LandmarkPath[]
): ViewerLandmark[] {
  const result: ViewerLandmark[] = [];

  // Create a map of toLandmarkId -> path for quick lookup
  const pathsByPOI = new Map<string, LandmarkPath>();
  paths.forEach((path) => {
    pathsByPOI.set(path.toLandmarkId, path);
  });

  // Convert each landmark
  landmarks.forEach((landmark) => {
    if (landmark.type === "complex") {
      // Complex landmark with polygon
      const geometry = landmark.geometry as PolygonGeometry;

      const viewerLandmark: ViewerLandmarkComplex = {
        id: landmark.id,
        name: landmark.name,
        description: landmark.description || undefined,
        image: undefined, // TODO: Add image support
        coords: geometry.vertices.flatMap((v) => [v.x, v.y]),
        type: "complex",
      };

      result.push(viewerLandmark);
    } else if (landmark.type === "poi") {
      // POI landmark with circle
      const geometry = landmark.geometry as CircleGeometry;

      // Get the path if it exists
      const path = pathsByPOI.get(landmark.id);

      const viewerLandmark: ViewerLandmarkPOI = {
        id: landmark.id,
        name: landmark.name,
        category: landmark.metadata?.category || undefined,
        description: landmark.description || undefined,
        image: undefined, // TODO: Add image support
        distanceK: landmark.metadata?.distanceK || undefined,
        timeMin: landmark.metadata?.timeMin || undefined,
        coords: {
          x: geometry.center.x,
          y: geometry.center.y,
        },
        type: "poi",
      };

      // Add path if it exists
      if (path) {
        const pathPoints = parsePathDataToArray(path.pathData);
        if (pathPoints.length > 0) {
          viewerLandmark.path = pathPoints;

          // Add path style if it exists
          if (path.style) {
            viewerLandmark.pathStyle = {
              stroke: path.style.stroke,
              strokeWidth: path.style.strokeWidth,
            };
          }
        }
      }

      result.push(viewerLandmark);
    }
  });

  return result;
}
/**
 * Parse SVG path data to flat array for viewer
 */
function parsePathDataToArray(pathData: string): number[] {
  const points: number[] = [];

  // Simple parser for "M x y L x y L x y" format
  const commands = pathData.trim().split(/\s+/);

  for (let i = 0; i < commands.length; i++) {
    if (commands[i] === "M" || commands[i] === "L") {
      const x = parseFloat(commands[i + 1]);
      const y = parseFloat(commands[i + 2]);
      if (!isNaN(x) && !isNaN(y)) {
        points.push(x, y);
      }
      i += 2;
    }
  }

  return points;
}

/**
 * Export landmarks to downloadable JSON file (client-side only)
 */
export function downloadLandmarksJSON(
  landmarks: Landmark[],
  paths: LandmarkPath[]
): void {
  const viewerFormat = exportLandmarksToViewerFormat(landmarks, paths);
  const json = JSON.stringify(viewerFormat, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "landmarks.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export map and landmarks to server
 */
export async function exportMapToServer(
  landmarks: Landmark[],
  paths: LandmarkPath[],
  mapImageUrl: string | null,
  projectId: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const viewerFormat = exportLandmarksToViewerFormat(landmarks, paths);

    const response = await fetch("http://localhost:3002/api/export/map", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        landmarks: viewerFormat,
        mapImage: mapImageUrl
          ? {
              url: mapImageUrl,
            }
          : null,
        projectId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Export failed");
    }

    return {
      success: true,
      message: result.message || "Export successful",
    };
  } catch (error) {
    return {
      success: false,
      message: "Export failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
