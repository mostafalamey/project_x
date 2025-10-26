/**
 * Floor Export Service
 * Handles exporting floor data to the backend server
 */

import type { FloorConfig, Model } from "../../types/admin-config";

const API_BASE_URL = "http://localhost:3002/api";

export interface ExportFloorRequest {
  floor: FloorConfig;
  building: {
    id: string;
    name: string;
  };
  models: Model[];
  projectId: string;
}

export interface ExportFloorResponse {
  success: boolean;
  message: string;
  files: {
    floor: string;
  };
  stats: {
    units: number;
    modelsReferenced: number;
  };
}

/**
 * Export floor to public/data/buildings/[buildingId]/floors/
 */
export async function exportFloor(
  data: ExportFloorRequest
): Promise<ExportFloorResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/export/floor/${data.building.id}/${data.floor.floorNumber}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Export failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Floor export error:", error);
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
