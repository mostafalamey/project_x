/**
 * Project Aggregator Service
 * Aggregates all project data from stores and IndexedDB for export
 */

import { db } from "../persistence/dexieDB";
import type { ProjectExport } from "./zipGenerator";

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Aggregate all project data from stores and IndexedDB
 */
export async function aggregateProjectData(
  projectId: string
): Promise<ProjectExport> {
  try {
    // Fetch all data from IndexedDB
    const [
      project,
      models,
      mapData,
      landmarks,
      paths,
      masterPlan,
      buildings,
      floors,
      tours,
      images,
    ] = await Promise.all([
      db.projects.get(projectId),
      db.models.where("projectId").equals(projectId).toArray(),
      db.maps.where("projectId").equals(projectId).first(),
      db.landmarks.where("projectId").equals(projectId).toArray(),
      db.paths.where("projectId").equals(projectId).toArray(),
      db.masterPlans.where("projectId").equals(projectId).first(),
      db.buildings.where("projectId").equals(projectId).toArray(),
      db.floors.where("projectId").equals(projectId).toArray(),
      db.tours.where("projectId").equals(projectId).toArray(),
      db.images.toArray(), // Get all images (not filtered by project)
    ]);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Build images map
    const imagesMap: { [key: string]: Blob | string } = {};
    for (const image of images) {
      if (image.blob) {
        // Use the image's filename or generate one from ID
        const imagePath =
          image.filename ||
          `image-${image.id}.${getImageExtension(image.mimeType)}`;
        imagesMap[imagePath] = image.blob;
      }
    }

    // Build export structure
    const projectExport: ProjectExport = {
      // Configuration files
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        developer: project.developer,
        metadata: project.metadata,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        version: project.version,
      },
      models: models.map(cleanModelData),
      landmarks: landmarks.map(cleanLandmarkData),
      masterplan: masterPlan
        ? {
            id: masterPlan.id,
            projectId: masterPlan.projectId,
            backgroundImage: masterPlan.backgroundImage,
            buildings: masterPlan.buildings,
            createdAt: masterPlan.createdAt,
            updatedAt: masterPlan.updatedAt,
          }
        : null,
      buildings: buildings.map(cleanBuildingData),
      floors: floors.map(cleanFloorData),
      tours: tours.map(cleanTourData),
      images: imagesMap,

      // Metadata
      exportDate: new Date().toISOString(),
      version: "1.0.0",
    };

    return projectExport;
  } catch (error) {
    console.error("Failed to aggregate project data:", error);
    throw error;
  }
}

// ============================================================================
// Data Cleaning Functions
// ============================================================================

/**
 * Remove internal metadata from model data
 */
function cleanModelData(model: any) {
  return {
    id: model.id,
    projectId: model.projectId,
    title: model.title,
    bedrooms: model.bedrooms,
    bathrooms: model.bathrooms,
    area: model.area,
    price: model.price,
    thumbnailImage: model.thumbnailImage,
    rotation360: model.rotation360,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

/**
 * Remove internal metadata from landmark data
 */
function cleanLandmarkData(landmark: any) {
  return {
    id: landmark.id,
    projectId: landmark.projectId,
    type: landmark.type,
    name: landmark.name,
    geometry: landmark.geometry,
    createdAt: landmark.createdAt,
    updatedAt: landmark.updatedAt,
  };
}

/**
 * Remove internal metadata from building data
 */
function cleanBuildingData(building: any) {
  return {
    id: building.id,
    projectId: building.projectId,
    name: building.name,
    description: building.description,
    address: building.address,
    exteriorImage: building.exteriorImage,
    floors: building.floors,
    createdAt: building.createdAt,
    updatedAt: building.updatedAt,
  };
}

/**
 * Remove internal metadata from floor data
 */
function cleanFloorData(floor: any) {
  return {
    id: floor.id,
    buildingId: floor.buildingId,
    name: floor.name,
    floorNumber: floor.floorNumber,
    floorPlanImage: floor.floorPlanImage,
    units: floor.units,
    createdAt: floor.createdAt,
    updatedAt: floor.updatedAt,
  };
}

/**
 * Remove internal metadata from tour data
 */
function cleanTourData(tour: any) {
  return {
    id: tour.id,
    modelId: tour.modelId,
    projectId: tour.projectId,
    startingSceneId: tour.startingSceneId,
    scenes: tour.scenes,
    createdAt: tour.createdAt,
    updatedAt: tour.updatedAt,
  };
}

/**
 * Get file extension from MIME type
 */
function getImageExtension(mimeType?: string): string {
  if (!mimeType) return "jpg";

  const mimeMap: { [key: string]: string } = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };

  return mimeMap[mimeType.toLowerCase()] || "jpg";
}
