/**
 * Master Plan Export Service
 * Handles exporting master plan data to the backend server
 */

import type {
  AngleView,
  BuildingReference,
  TourPoint,
} from "../../types/admin-config";

const API_BASE_URL = "http://localhost:3002/api";

export interface ExportMasterPlanRequest {
  angles: AngleView[];
  buildings: BuildingReference[];
  tourPoints: TourPoint[];
  projectId: string;
}

export interface ExportMasterPlanResponse {
  success: boolean;
  message: string;
  files: {
    masterplan: string;
  };
  stats: {
    angles: number;
    buildings: number;
    images: number;
    hotspots: number;
  };
}

/**
 * Export master plan to public/data/masterplan/
 */
export async function exportMasterPlan(
  data: ExportMasterPlanRequest
): Promise<ExportMasterPlanResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/export/masterplan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Export failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Master plan export error:", error);
    throw error;
  }
}

/**
 * Check if the backend server is running
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
