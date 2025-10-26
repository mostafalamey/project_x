/**
 * Direct File Export Service
 * Export models by writing directly to public/data/models folder
 *
 * NOTE: This uses the File System Access API which requires user permission
 * and only works in modern browsers (Chrome 86+, Edge 86+)
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
 * Request access to a directory
 */
async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle> {
  if (!("showDirectoryPicker" in window)) {
    throw new Error(
      "File System Access API is not supported in this browser. Please use Chrome or Edge."
    );
  }

  // @ts-ignore - TypeScript doesn't have types for this yet
  return await window.showDirectoryPicker({
    mode: "readwrite",
    startIn: "documents",
  });
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export models with images directly to file system
 * User will be prompted to select the public/data folder
 */
export async function exportModelsToFileSystem(
  projectId: string
): Promise<void> {
  const models = await db.models.where("projectId").equals(projectId).toArray();

  if (models.length === 0) {
    throw new Error("No models to export");
  }

  try {
    // Ask user to select the public/data directory
    const dataDir = await getDirectoryHandle();

    // Get or create models directory
    const modelsDir = await dataDir.getDirectoryHandle("models", {
      create: true,
    });

    // Create models array for JSON
    const modelsData: ModelExportItem[] = [];

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

      // Export thumbnail image
      if (model.thumbnail) {
        try {
          const thumbnailBlob = await imageRefToBlob(model.thumbnail);
          const ext = getExtensionFromMimeType(model.thumbnail.mimeType);
          const filename = `model-${modelId}.${ext}`;

          // Create file in models directory
          const fileHandle = await modelsDir.getFileHandle(filename, {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          await writable.write(thumbnailBlob);
          await writable.close();

          modelData.imagePath = `/data/models/${filename}`;
        } catch (err) {
          console.error(
            `Failed to export thumbnail for model ${modelId}:`,
            err
          );
        }
      }

      // Export 360° rotation frames
      if (
        model.rotation360 &&
        model.rotation360.frames &&
        model.rotation360.frames.length > 0
      ) {
        try {
          // Create model-specific directory for 360° frames
          const model360Dir = await modelsDir.getDirectoryHandle(
            `model-${modelId}`,
            { create: true }
          );
          const frameCount = model.rotation360.frames.length;

          // Export each frame
          for (let i = 0; i < model.rotation360.frames.length; i++) {
            const frame = model.rotation360.frames[i];
            const frameBlob = await imageRefToBlob(frame);
            const ext = getExtensionFromMimeType(frame.mimeType);
            const filename = `model-${modelId}_${i}.${ext}`;

            const fileHandle = await model360Dir.getFileHandle(filename, {
              create: true,
            });
            const writable = await fileHandle.createWritable();
            await writable.write(frameBlob);
            await writable.close();
          }

          // Add rotation360 config to model data
          modelData.rotation360 = {
            folder: `/data/models/model-${modelId}`,
            frameCount: frameCount,
            filenamePattern: `model-${modelId}_{index}.jpg`,
          };
        } catch (err) {
          console.error(
            `Failed to export 360° frames for model ${modelId}:`,
            err
          );
        }
      }

      modelsData.push(modelData);
    }

    // Write models.json to data directory (overwrite entire file)
    const modelsJson = JSON.stringify(modelsData, null, 2);
    const jsonBlob = new Blob([modelsJson], { type: "application/json" });

    const jsonFileHandle = await dataDir.getFileHandle("models.json", {
      create: true,
    });
    const jsonWritable = await jsonFileHandle.createWritable();
    await jsonWritable.write(jsonBlob);
    await jsonWritable.close();

    console.log(`Successfully exported ${models.length} models to file system`);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Export cancelled by user");
    }
    throw err;
  }
}

/**
 * Export complete project to file system
 */
export async function exportCompleteProjectToFileSystem(
  projectId: string
): Promise<void> {
  const project = await db.projects.get(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  try {
    // Ask user to select the public directory
    const publicDir = await getDirectoryHandle();

    // Get or create data directory
    const dataDir = await publicDir.getDirectoryHandle("data", {
      create: true,
    });

    // Export models with images
    await exportModelsToFileSystemWithDir(projectId, dataDir);

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

    const projectFileHandle = await dataDir.getFileHandle("project.json", {
      create: true,
    });
    const projectWritable = await projectFileHandle.createWritable();
    await projectWritable.write(projectBlob);
    await projectWritable.close();

    console.log("Successfully exported complete project to file system");
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Export cancelled by user");
    }
    throw err;
  }
}

/**
 * Helper function to export models when data directory is already obtained
 */
async function exportModelsToFileSystemWithDir(
  projectId: string,
  dataDir: FileSystemDirectoryHandle
): Promise<void> {
  const models = await db.models.where("projectId").equals(projectId).toArray();
  const modelsDir = await dataDir.getDirectoryHandle("models", {
    create: true,
  });
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
        const filename = `model-${modelId}.${ext}`;

        const fileHandle = await modelsDir.getFileHandle(filename, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(thumbnailBlob);
        await writable.close();

        modelData.imagePath = `/data/models/${filename}`;
      } catch (err) {
        console.error(`Failed to export thumbnail for model ${modelId}:`, err);
      }
    }

    if (
      model.rotation360 &&
      model.rotation360.frames &&
      model.rotation360.frames.length > 0
    ) {
      try {
        const model360Dir = await modelsDir.getDirectoryHandle(
          `model-${modelId}`,
          { create: true }
        );
        const frameCount = model.rotation360.frames.length;

        for (let i = 0; i < model.rotation360.frames.length; i++) {
          const frame = model.rotation360.frames[i];
          const frameBlob = await imageRefToBlob(frame);
          const ext = getExtensionFromMimeType(frame.mimeType);
          const filename = `model-${modelId}_${i}.${ext}`;

          const fileHandle = await model360Dir.getFileHandle(filename, {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          await writable.write(frameBlob);
          await writable.close();
        }

        modelData.rotation360 = {
          folder: `/data/models/model-${modelId}`,
          frameCount: frameCount,
          filenamePattern: `model-${modelId}_{index}.jpg`,
        };
      } catch (err) {
        console.error(
          `Failed to export 360° frames for model ${modelId}:`,
          err
        );
      }
    }

    modelsData.push(modelData);
  }

  // Write models.json (overwrite entire file)
  const modelsJson = JSON.stringify(modelsData, null, 2);
  const jsonBlob = new Blob([modelsJson], { type: "application/json" });

  const jsonFileHandle = await dataDir.getFileHandle("models.json", {
    create: true,
  });
  const jsonWritable = await jsonFileHandle.createWritable();
  await jsonWritable.write(jsonBlob);
  await jsonWritable.close();
}
