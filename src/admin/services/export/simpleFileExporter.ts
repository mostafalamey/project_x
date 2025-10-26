/**
 * Simple File Export Service
 * Export models by downloading files that can be placed in public/data/models
 * No ZIP files, no browser prompts - just direct downloads
 */

import { db } from "../persistence/dexieDB";
import { Model, ImageRef } from "../../types/admin-config";

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
 * Convert ImageRef to Blob
 */
async function imageRefToBlob(imageRef: ImageRef): Promise<Blob> {
  if (imageRef.blob) {
    return imageRef.blob;
  }

  if (imageRef.url) {
    if (imageRef.url.startsWith("data:")) {
      const response = await fetch(imageRef.url);
      return await response.blob();
    }
    const response = await fetch(imageRef.url);
    return await response.blob();
  }

  throw new Error(`Cannot convert ImageRef to blob: ${imageRef.filename}`);
}

/**
 * Get file extension from mime type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/jpg": "jpg",
  };
  return map[mimeType] || "jpg";
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export models - generates models.json and downloads individual image files
 * User needs to manually place files in public/data/models
 */
export async function exportModels(projectId: string): Promise<string> {
  const models = await db.models.where("projectId").equals(projectId).toArray();

  if (models.length === 0) {
    throw new Error("No models to export");
  }

  const modelsData: ModelExportItem[] = [];
  const filesToDownload: { blob: Blob; filename: string; folder: string }[] =
    [];

  // Process each model
  for (const model of models) {
    const modelId = model.id;

    // Create model data for JSON
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

    // Prepare thumbnail for download
    if (model.thumbnail) {
      try {
        const thumbnailBlob = await imageRefToBlob(model.thumbnail);
        const ext = getExtensionFromMimeType(model.thumbnail.mimeType);
        const filename = `model-${modelId}.${ext}`;

        filesToDownload.push({
          blob: thumbnailBlob,
          filename: filename,
          folder: "models",
        });

        modelData.imagePath = `/data/models/${filename}`;
      } catch (err) {
        console.error(`Failed to prepare thumbnail for model ${modelId}:`, err);
      }
    }

    // Prepare 360° rotation frames for download
    if (
      model.rotation360 &&
      model.rotation360.frames &&
      model.rotation360.frames.length > 0
    ) {
      try {
        const frameCount = model.rotation360.frames.length;

        // Prepare each frame
        for (let i = 0; i < model.rotation360.frames.length; i++) {
          const frame = model.rotation360.frames[i];
          const frameBlob = await imageRefToBlob(frame);
          const ext = getExtensionFromMimeType(frame.mimeType);
          const filename = `model-${modelId}_${i}.${ext}`;

          filesToDownload.push({
            blob: frameBlob,
            filename: filename,
            folder: `models/model-${modelId}`,
          });
        }

        // Add rotation360 config to model data
        modelData.rotation360 = {
          folder: `/data/models/model-${modelId}`,
          frameCount: frameCount,
          filenamePattern: `model-${modelId}_{index}.jpg`,
        };
      } catch (err) {
        console.error(
          `Failed to prepare 360° frames for model ${modelId}:`,
          err
        );
      }
    }

    modelsData.push(modelData);
  }

  // Download models.json
  const modelsJson = JSON.stringify(modelsData, null, 2);
  const jsonBlob = new Blob([modelsJson], { type: "application/json" });
  downloadBlob(jsonBlob, "models.json");

  // Small delay between downloads to prevent browser blocking
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Download all image files
  for (const file of filesToDownload) {
    downloadBlob(file.blob, file.filename);
    await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay between downloads
  }

  // Return instructions
  const instructions = `
Downloaded ${filesToDownload.length} files + models.json

Place files in your project:
1. models.json → public/data/models.json
2. model-*.jpg files → public/data/models/
3. model-*_*.jpg files → public/data/models/model-{id}/

Example structure:
public/data/
├── models.json
└── models/
    ├── model-A-1.jpg
    ├── model-A-1/
    │   ├── model-A-1_0.jpg
    │   ├── model-A-1_1.jpg
    │   └── ...
    └── ...
`;

  return instructions;
}

/**
 * Export complete project
 */
export async function exportCompleteProject(
  projectId: string
): Promise<string> {
  const project = await db.projects.get(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Export models first
  await exportModels(projectId);

  // Small delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Export project configuration
  const projectConfig = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    developer: project.developer,
    metadata: project.metadata,
    version: project.version,
    exportedAt: new Date().toISOString(),
  };

  const projectJson = JSON.stringify(projectConfig, null, 2);
  const projectBlob = new Blob([projectJson], { type: "application/json" });
  downloadBlob(projectBlob, "project.json");

  return `
Downloaded project.json + all model files

Place files in your project:
1. project.json → public/data/project.json
2. models.json → public/data/models.json  
3. All model images → public/data/models/
`;
}
