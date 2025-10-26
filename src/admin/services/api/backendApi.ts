/**
 * Backend API Service
 * Communicates with the local Node.js server for file operations
 */

import { db } from "../persistence/dexieDB";
import { Model, ImageRef } from "../../types/admin-config";

const API_BASE_URL = "http://localhost:3002/api";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert ImageRef to base64 data URL for transmission to backend
 */
async function imageRefToDataURL(imageRef: ImageRef): Promise<string> {
  if (imageRef.url) {
    // If it's already a data URL, return it
    if (imageRef.url.startsWith("data:")) {
      return imageRef.url;
    }

    // If it's an object URL or external URL, fetch and convert
    const response = await fetch(imageRef.url);
    const blob = await response.blob();
    return await blobToDataURL(blob);
  }

  if (imageRef.blob) {
    return await blobToDataURL(imageRef.blob);
  }

  throw new Error(`Cannot convert ImageRef to data URL: ${imageRef.filename}`);
}

/**
 * Convert Blob to data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Check if backend server is running
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === "ok";
  } catch (error) {
    return false;
  }
}

/**
 * Export models to public/data/models via backend
 */
export async function exportModelsViaBackend(projectId: string): Promise<{
  success: boolean;
  message: string;
  modelsCount: number;
  imagesCount: number;
}> {
  // Check if server is running
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    throw new Error(
      "Backend server is not running. Please start it with: cd server && npm install && npm run dev"
    );
  }

  // Get models from database
  const models = await db.models.where("projectId").equals(projectId).toArray();

  if (models.length === 0) {
    throw new Error("No models to export");
  }

  // Prepare models data with base64 images
  const modelsData = await Promise.all(
    models.map(async (model: Model) => {
      const modelData: any = {
        id: model.id,
        title: model.title,
        description: model.description,
        areaM2: model.areaM2,
        bedrooms: model.bedrooms,
        bathrooms: model.bathrooms,
        tourPath: model.tourPath || null,
      };

      // Include thumbnail as base64
      if (model.thumbnail) {
        try {
          const dataURL = await imageRefToDataURL(model.thumbnail);
          modelData.thumbnail = {
            url: dataURL,
            mimeType: model.thumbnail.mimeType,
          };
        } catch (err) {
          console.error(`Failed to convert thumbnail for ${model.id}:`, err);
        }
      }

      // Include 360° rotation frames as base64
      if (
        model.rotation360 &&
        model.rotation360.frames &&
        model.rotation360.frames.length > 0
      ) {
        try {
          const frames = await Promise.all(
            model.rotation360.frames.map(async (frame) => ({
              url: await imageRefToDataURL(frame),
              mimeType: frame.mimeType,
            }))
          );
          modelData.rotation360 = {
            frames,
          };
        } catch (err) {
          console.error(`Failed to convert 360° frames for ${model.id}:`, err);
        }
      }

      return modelData;
    })
  );

  // Send to backend
  const response = await fetch(`${API_BASE_URL}/export/models`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ models: modelsData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to export models");
  }

  return await response.json();
}

/**
 * Export complete project to public/data via backend
 */
export async function exportCompleteProjectViaBackend(
  projectId: string
): Promise<{
  success: boolean;
  message: string;
}> {
  // Check if server is running
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    throw new Error(
      "Backend server is not running. Please start it with: cd server && npm install && npm run dev"
    );
  }

  // Get project and models
  const project = await db.projects.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const models = await db.models.where("projectId").equals(projectId).toArray();

  // Prepare models data
  const modelsData = await Promise.all(
    models.map(async (model: Model) => {
      const modelData: any = {
        id: model.id,
        title: model.title,
        description: model.description,
        areaM2: model.areaM2,
        bedrooms: model.bedrooms,
        bathrooms: model.bathrooms,
        tourPath: model.tourPath || null,
      };

      if (model.thumbnail) {
        try {
          modelData.thumbnail = {
            url: await imageRefToDataURL(model.thumbnail),
            mimeType: model.thumbnail.mimeType,
          };
        } catch (err) {
          console.error(`Failed to convert thumbnail for ${model.id}:`, err);
        }
      }

      if (
        model.rotation360 &&
        model.rotation360.frames &&
        model.rotation360.frames.length > 0
      ) {
        try {
          const frames = await Promise.all(
            model.rotation360.frames.map(async (frame) => ({
              url: await imageRefToDataURL(frame),
              mimeType: frame.mimeType,
            }))
          );
          modelData.rotation360 = { frames };
        } catch (err) {
          console.error(`Failed to convert 360° frames for ${model.id}:`, err);
        }
      }

      return modelData;
    })
  );

  // Prepare project data
  const projectData = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    developer: project.developer,
    metadata: project.metadata,
    version: project.version,
    exportedAt: new Date().toISOString(),
  };

  // Send to backend
  const response = await fetch(`${API_BASE_URL}/export/project`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: projectData,
      models: modelsData,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to export project");
  }

  return await response.json();
}
