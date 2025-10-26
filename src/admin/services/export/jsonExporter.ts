/**
 * JSON Exporter Service
 * Export configuration data to JSON files matching viewer schema
 */

import { db } from "../persistence/dexieDB";
import { Model } from "../../types/admin-config";

// ============================================================================
// Models Export
// ============================================================================

export interface ModelsExportSchema {
  models: Array<{
    id: string;
    title: string;
    description: string;
    specs: {
      areaM2: number;
      bedrooms: number;
      bathrooms: number;
    };
    media: {
      thumbnail: string;
      rotation360?: {
        frameCount: number;
        filenamePattern: string;
        folder: string;
      };
    };
    pricing?: {
      startingPrice?: number;
      currency: string;
    };
    availability: string;
  }>;
}

/**
 * Export models to JSON format matching viewer schema
 */
export async function exportModels(
  projectId: string
): Promise<ModelsExportSchema> {
  const models = await db.models.where("projectId").equals(projectId).toArray();

  const exportData: ModelsExportSchema = {
    models: models.map((model: Model) => ({
      id: model.id,
      title: model.title,
      description: model.description,
      specs: {
        areaM2: model.areaM2 || 0,
        bedrooms: model.bedrooms || 0,
        bathrooms: model.bathrooms || 0,
      },
      media: {
        thumbnail: model.thumbnail?.url || "",
        rotation360: model.rotation360
          ? {
              frameCount: model.rotation360.frameCount,
              filenamePattern: model.rotation360.filenamePattern || "",
              folder: model.rotation360.folder,
            }
          : undefined,
      },
      pricing: undefined,
      availability: "available",
    })),
  };

  return exportData;
}

/**
 * Validate models export against schema
 */
export function validateModelsExport(data: ModelsExportSchema): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.models || !Array.isArray(data.models)) {
    errors.push("Invalid models array");
    return { isValid: false, errors };
  }

  data.models.forEach((model, index) => {
    if (!model.id) {
      errors.push(`Model ${index}: Missing ID`);
    }
    if (!model.title) {
      errors.push(`Model ${index}: Missing title`);
    }
    if (!model.specs || model.specs.areaM2 <= 0) {
      errors.push(`Model ${index}: Invalid specs`);
    }
    if (!model.media || !model.media.thumbnail) {
      errors.push(`Model ${index}: Missing thumbnail`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Project Export
// ============================================================================

export interface ProjectExportSchema {
  id: string;
  name: string;
  slug: string;
  developer: {
    name: string;
    logo?: string;
    contact: {
      email?: string;
      phone?: string;
      website?: string;
    };
  };
  metadata: {
    location?: string;
    description?: string;
    completionDate?: string;
    totalUnits?: number;
  };
  version: string;
}

/**
 * Export project configuration
 */
export async function exportProject(
  projectId: string
): Promise<ProjectExportSchema | null> {
  const project = await db.projects.get(projectId);
  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    developer: project.developer,
    metadata: project.metadata,
    version: project.version,
  };
}

// ============================================================================
// Complete Export (All Data)
// ============================================================================

export interface CompleteExportSchema {
  project: ProjectExportSchema;
  models: ModelsExportSchema;
  exportedAt: string;
  version: string;
}

/**
 * Export all project data
 */
export async function exportComplete(
  projectId: string
): Promise<CompleteExportSchema> {
  const project = await exportProject(projectId);
  const models = await exportModels(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  return {
    project,
    models,
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
  };
}

// ============================================================================
// File Download Helpers
// ============================================================================

/**
 * Download data as JSON file
 */
export function downloadJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export models to JSON file
 */
export async function exportModelsToFile(
  projectId: string,
  filename?: string
): Promise<void> {
  const data = await exportModels(projectId);
  const validation = validateModelsExport(data);

  if (!validation.isValid) {
    throw new Error(
      `Export validation failed: ${validation.errors.join(", ")}`
    );
  }

  downloadJSON(data, filename || "models.json");
}

/**
 * Export complete project to JSON file
 */
export async function exportCompleteToFile(
  projectId: string,
  filename?: string
): Promise<void> {
  const data = await exportComplete(projectId);
  downloadJSON(data, filename || `project-${data.project.slug}-export.json`);
}
