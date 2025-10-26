/**
 * Tour Export Service
 * Handles exporting virtual tour configurations to JSON format
 */

import type { TourConfig } from "../types/admin-config";

export interface TourExportData {
  tourId: string;
  modelId: string;
  projectId: string;
  startingSceneId: string;
  scenes: Array<{
    id: string;
    name: string;
    panoramaImage: {
      url: string;
      filename: string;
    };
    hotspots: Array<{
      id: string;
      targetSceneId: string;
      position: {
        yaw: number;
        pitch: number;
      };
      tooltip?: string;
      icon: "arrow" | "door" | "info" | "custom";
    }>;
  }>;
  metadata: {
    exportDate: string;
    version: string;
    sceneCount: number;
    totalHotspots: number;
  };
}

/**
 * Prepare tour configuration for export
 */
export function prepareTourForExport(tour: TourConfig): TourExportData {
  const totalHotspots = tour.scenes.reduce(
    (sum, scene) => sum + scene.hotspots.length,
    0
  );

  return {
    tourId: tour.id,
    modelId: tour.modelId,
    projectId: tour.projectId,
    startingSceneId: tour.startingSceneId,
    scenes: tour.scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      panoramaImage: {
        url: scene.panoramaImage.url || "",
        filename: scene.panoramaImage.filename,
      },
      hotspots: scene.hotspots.map((hotspot) => ({
        id: hotspot.id,
        targetSceneId: hotspot.targetSceneId,
        position: {
          yaw: hotspot.position.yaw,
          pitch: hotspot.position.pitch,
        },
        tooltip: hotspot.tooltip,
        icon: hotspot.icon || "arrow",
      })),
    })),
    metadata: {
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      sceneCount: tour.scenes.length,
      totalHotspots,
    },
  };
}

/**
 * Export tour configuration to backend
 */
export async function exportTourToBackend(
  modelId: string,
  tour: TourConfig
): Promise<{ success: boolean; message: string; filename?: string }> {
  try {
    const exportData = prepareTourForExport(tour);

    const response = await fetch(`/api/export/tour/${modelId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(exportData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Export failed");
    }

    const result = await response.json();
    return {
      success: true,
      message: `Tour exported successfully`,
      filename: result.filename,
    };
  } catch (error: any) {
    console.error("Tour export error:", error);
    return {
      success: false,
      message: error.message || "Failed to export tour",
    };
  }
}

/**
 * Download tour configuration as JSON file (client-side only)
 */
export function downloadTourAsJSON(tour: TourConfig): void {
  const exportData = prepareTourForExport(tour);
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tour-${tour.modelId}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
