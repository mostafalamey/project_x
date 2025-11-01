/**
 * Project Import Service
 * Loads extracted project data into stores and IndexedDB
 */

import { db } from "../persistence/dexieDB";
import type { ExtractedProject } from "./zipExtractor";
import type {
  ProjectConfig,
  Model,
  Landmark,
  LandmarkPath,
  MasterPlanConfig,
  BuildingConfig,
  FloorConfig,
  TourConfig,
  ImageRef,
} from "../../types/admin-config";

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import full project into IndexedDB and stores
 */
export async function importProjectData(
  extractedProject: ExtractedProject
): Promise<void> {
  try {
    // Start a transaction for data consistency
    await db.transaction(
      "rw",
      [
        db.projects,
        db.models,
        db.maps,
        db.landmarks,
        db.paths,
        db.masterPlans,
        db.buildings,
        db.floors,
        db.tours,
        db.images,
      ],
      async () => {
        const projectId = extractedProject.project.id;

        // 1. Import project configuration
        await importProject(extractedProject.project);

        // 2. Import images first (they're referenced by other entities)
        const imageIdMap = await importImages(
          projectId,
          extractedProject.images
        );

        // 3. Import models
        await importModels(projectId, extractedProject.models);

        // 4. Import landmarks
        await importLandmarks(projectId, extractedProject.landmarks);

        // 5. Import master plan
        if (extractedProject.masterplan) {
          await importMasterPlan(projectId, extractedProject.masterplan);
        }

        // 6. Import buildings
        await importBuildings(projectId, extractedProject.buildings);

        // 7. Import floors
        await importFloors(projectId, extractedProject.floors);

        // 8. Import tours
        await importTours(projectId, extractedProject.tours);
      }
    );
  } catch (error) {
    console.error("Failed to import project:", error);
    throw new Error(
      `Import failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ============================================================================
// Individual Import Functions
// ============================================================================

/**
 * Import project configuration
 */
async function importProject(project: ProjectConfig): Promise<void> {
  await db.projects.put(project);
}

/**
 * Import images and return ID mapping
 */
async function importImages(
  projectId: string,
  images: Map<string, Blob>
): Promise<Map<string, string>> {
  const imageIdMap = new Map<string, string>();

  for (const [filename, blob] of images.entries()) {
    const imageRef: ImageRef = {
      id: crypto.randomUUID(),
      filename,
      blob,
      url: URL.createObjectURL(blob),
      width: 0, // Will be determined when loaded
      height: 0,
      size: blob.size,
      mimeType: blob.type.startsWith("image/png") ? "image/png" : "image/jpeg",
      uploadedAt: new Date().toISOString(),
    };

    await db.images.add(imageRef);

    imageIdMap.set(filename, imageRef.id);
  }

  return imageIdMap;
}

/**
 * Import models
 */
async function importModels(projectId: string, models: Model[]): Promise<void> {
  for (const model of models) {
    await db.models.put({
      ...model,
      projectId,
    });
  }
}

/**
 * Import landmarks
 */
async function importLandmarks(
  projectId: string,
  landmarks: Landmark[]
): Promise<void> {
  for (const landmark of landmarks) {
    await db.landmarks.put({
      ...landmark,
      projectId,
    });
  }
}

/**
 * Import master plan
 */
async function importMasterPlan(
  projectId: string,
  masterplan: MasterPlanConfig
): Promise<void> {
  await db.masterPlans.put({
    ...masterplan,
    projectId,
  });
}

/**
 * Import buildings
 */
async function importBuildings(
  projectId: string,
  buildings: BuildingConfig[]
): Promise<void> {
  for (const building of buildings) {
    await db.buildings.put({
      ...building,
      projectId,
    });
  }
}

/**
 * Import floors
 */
async function importFloors(
  projectId: string,
  floors: FloorConfig[]
): Promise<void> {
  for (const floor of floors) {
    await db.floors.put({
      ...floor,
      projectId,
    });
  }
}

/**
 * Import tours
 */
async function importTours(
  projectId: string,
  tours: TourConfig[]
): Promise<void> {
  for (const tour of tours) {
    await db.tours.put({
      ...tour,
      projectId,
    });
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all existing project data before import
 */
export async function clearProjectData(projectId: string): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.projects,
      db.models,
      db.maps,
      db.landmarks,
      db.paths,
      db.masterPlans,
      db.buildings,
      db.floors,
      db.tours,
      db.images,
    ],
    async () => {
      await db.projects.where("id").equals(projectId).delete();
      await db.models.where("projectId").equals(projectId).delete();
      await db.maps.where("projectId").equals(projectId).delete();
      await db.landmarks.where("projectId").equals(projectId).delete();
      await db.paths.where("projectId").equals(projectId).delete();
      await db.masterPlans.where("projectId").equals(projectId).delete();
      await db.buildings.where("projectId").equals(projectId).delete();
      await db.floors.where("projectId").equals(projectId).delete();
      await db.tours.where("projectId").equals(projectId).delete();
      // Note: Images are not deleted as they might be referenced by other projects
      // and ImageRef doesn't have a projectId field
    }
  );
}
