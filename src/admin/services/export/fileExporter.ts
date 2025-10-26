/**
 * File Export Service
 * Export models with JSON and image files to match viewer structure
 */

import { db } from "../persistence/dexieDB";
import { Model, ImageRef } from "../../types/admin-config";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// ============================================================================
// Export Schema (Viewer Format)
// ============================================================================

export interface ModelExportItem {
  id: string;
  title: string;
  description: string;
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  tourPath: string | null;
  imagePath: string;
  rotation360?: {
    folder: string;
    frameCount: number;
    filenamePattern?: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert ImageRef blob to file blob
 */
async function imageRefToBlob(imageRef: ImageRef): Promise<Blob> {
  if (imageRef.blob) {
    return imageRef.blob;
  }

  if (imageRef.url) {
    // If it's a data URL, convert it
    if (imageRef.url.startsWith("data:")) {
      const response = await fetch(imageRef.url);
      return await response.blob();
    }

    // If it's an object URL or external URL, fetch it
    const response = await fetch(imageRef.url);
    return await response.blob();
  }

  throw new Error(`Cannot convert ImageRef to blob: ${imageRef.filename}`);
}

/**
 * Get filename extension from mime type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/jpg": "jpg",
  };
  return map[mimeType] || "jpg";
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export models with images to ZIP file
 */
export async function exportModelsWithImages(projectId: string): Promise<void> {
  const models = await db.models.where("projectId").equals(projectId).toArray();

  if (models.length === 0) {
    throw new Error("No models to export");
  }

  const zip = new JSZip();

  // Create models array for JSON
  const modelsData: ModelExportItem[] = [];

  // Process each model
  for (const model of models) {
    const modelId = model.id;

    // Add model to JSON data
    const modelData: ModelExportItem = {
      id: modelId,
      title: model.title,
      description: model.description,
      areaM2: model.areaM2,
      bedrooms: model.bedrooms,
      bathrooms: model.bathrooms,
      tourPath: model.tourPath || null,
      imagePath: `/data/models/model-${modelId}.jpg`,
    };

    // Export thumbnail image
    if (model.thumbnail) {
      try {
        const thumbnailBlob = await imageRefToBlob(model.thumbnail);
        const ext = getExtensionFromMimeType(model.thumbnail.mimeType);
        zip.file(`models/model-${modelId}.${ext}`, thumbnailBlob);
        modelData.imagePath = `/data/models/model-${modelId}.${ext}`;
      } catch (err) {
        console.error(`Failed to export thumbnail for model ${modelId}:`, err);
      }
    }

    // Export 360° rotation frames
    if (
      model.rotation360 &&
      model.rotation360.frames &&
      model.rotation360.frames.length > 0
    ) {
      const rotation360Folder = `models/model-${modelId}`;
      const frameCount = model.rotation360.frames.length;

      // Add frames to ZIP
      for (let i = 0; i < model.rotation360.frames.length; i++) {
        const frame = model.rotation360.frames[i];
        try {
          const frameBlob = await imageRefToBlob(frame);
          const ext = getExtensionFromMimeType(frame.mimeType);
          const filename = `model-${modelId}_${i}.${ext}`;
          zip.file(`${rotation360Folder}/${filename}`, frameBlob);
        } catch (err) {
          console.error(
            `Failed to export frame ${i} for model ${modelId}:`,
            err
          );
        }
      }

      // Add rotation360 config to model data
      modelData.rotation360 = {
        folder: `/data/${rotation360Folder}`,
        frameCount: frameCount,
        filenamePattern: `model-${modelId}_{index}.jpg`,
      };
    }

    modelsData.push(modelData);
  }

  // Add models.json to ZIP
  const modelsJson = JSON.stringify(modelsData, null, 2);
  zip.file("models.json", modelsJson);

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "models-export.zip");
}

/**
 * Export complete project with all data
 */
export async function exportCompleteProject(projectId: string): Promise<void> {
  const project = await db.projects.get(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const zip = new JSZip();

  // Export models with images
  const models = await db.models.where("projectId").equals(projectId).toArray();
  const modelsData: ModelExportItem[] = [];

  for (const model of models) {
    const modelId = model.id;

    const modelData: ModelExportItem = {
      id: modelId,
      title: model.title,
      description: model.description,
      areaM2: model.areaM2,
      bedrooms: model.bedrooms,
      bathrooms: model.bathrooms,
      tourPath: model.tourPath || null,
      imagePath: `/data/models/model-${modelId}.jpg`,
    };

    if (model.thumbnail) {
      try {
        const thumbnailBlob = await imageRefToBlob(model.thumbnail);
        const ext = getExtensionFromMimeType(model.thumbnail.mimeType);
        zip.file(`data/models/model-${modelId}.${ext}`, thumbnailBlob);
        modelData.imagePath = `/data/models/model-${modelId}.${ext}`;
      } catch (err) {
        console.error(`Failed to export thumbnail for model ${modelId}:`, err);
      }
    }

    if (
      model.rotation360 &&
      model.rotation360.frames &&
      model.rotation360.frames.length > 0
    ) {
      const rotation360Folder = `data/models/model-${modelId}`;
      const frameCount = model.rotation360.frames.length;

      for (let i = 0; i < model.rotation360.frames.length; i++) {
        const frame = model.rotation360.frames[i];
        try {
          const frameBlob = await imageRefToBlob(frame);
          const ext = getExtensionFromMimeType(frame.mimeType);
          const filename = `model-${modelId}_${i}.${ext}`;
          zip.file(`${rotation360Folder}/${filename}`, frameBlob);
        } catch (err) {
          console.error(
            `Failed to export frame ${i} for model ${modelId}:`,
            err
          );
        }
      }

      modelData.rotation360 = {
        folder: `/data/models/model-${modelId}`,
        frameCount: frameCount,
        filenamePattern: `model-${modelId}_{index}.jpg`,
      };
    }

    modelsData.push(modelData);
  }

  // Add models.json
  zip.file("data/models.json", JSON.stringify(modelsData, null, 2));

  // Add project configuration
  const projectConfig = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    developer: project.developer,
    metadata: project.metadata,
    version: project.version,
    exportedAt: new Date().toISOString(),
  };

  zip.file("data/project.json", JSON.stringify(projectConfig, null, 2));

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${project.slug}-complete-export.zip`);
}

/**
 * Validate model data before export
 */
export function validateModelForExport(model: Model): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!model.id) {
    errors.push("Model ID is required");
  }

  if (!model.title) {
    errors.push("Model title is required");
  }

  if (!model.areaM2 || model.areaM2 <= 0) {
    errors.push("Model area must be greater than 0");
  }

  if (!model.thumbnail) {
    errors.push("Model thumbnail is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
