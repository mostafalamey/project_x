/**
 * Dexie Database Configuration
 * IndexedDB schema and database instance for admin dashboard
 */

import Dexie, { Table } from "dexie";
import type {
  ProjectConfig,
  Model,
  MapConfig,
  Landmark,
  LandmarkPath,
  MasterPlanConfig,
  AngleView,
  BuildingConfig,
  FloorConfig,
  UnitHotspot,
  TourConfig,
  TourScene,
  TourPoint,
  ImageRef,
} from "../../types/admin-config";

// ============================================================================
// Database Interface
// ============================================================================

export interface AdminConfigDB extends Dexie {
  // Core entities
  projects: Table<ProjectConfig, string>;
  models: Table<Model, string>;
  maps: Table<MapConfig, string>;
  landmarks: Table<Landmark, string>;
  paths: Table<LandmarkPath, string>;
  masterPlans: Table<MasterPlanConfig, string>;
  angles: Table<AngleView, string>;
  buildings: Table<BuildingConfig, string>;
  floors: Table<FloorConfig, string>;
  units: Table<UnitHotspot, string>;
  tours: Table<TourConfig, string>;
  scenes: Table<TourScene, string>;
  tourPoints: Table<TourPoint, string>;

  // Media storage
  images: Table<ImageRef, string>;

  // Autosave snapshots
  autosave: Table<AutosaveSnapshot, string>;
}

export interface AutosaveSnapshot {
  key: string; // Unique key for the snapshot
  data: string; // JSON stringified data
  timestamp: number; // Unix timestamp
}

// ============================================================================
// Database Instance
// ============================================================================

export const db = new Dexie("AdminConfigDB") as AdminConfigDB;

// ============================================================================
// Schema Definition
// ============================================================================

db.version(1).stores({
  // Core entities with indexes
  projects: "++id, slug, updatedAt",
  models: "++id, projectId, displayOrder",
  maps: "++id, projectId",
  landmarks: "++id, [projectId+type]",
  paths: "++id, projectId, fromLandmarkId, toLandmarkId",
  masterPlans: "++id, projectId",
  angles: "++id, masterPlanId, sequenceIndex",
  buildings: "++id, projectId, name",
  floors: "++id, buildingId, floorNumber, projectId",
  units: "++id, floorId, modelId, unitNumber",
  tours: "++id, projectId, modelId",
  scenes: "++id, tourId",

  // Media storage
  images: "++id, filename, uploadedAt",

  // Autosave snapshots
  autosave: "key, timestamp",
});

// Version 2: Add projectId index to angles table
db.version(2).stores({
  angles: "++id, masterPlanId, projectId, sequenceIndex",
});

// Version 3: Add tourPoints table
db.version(3).stores({
  angles: "++id, masterPlanId, projectId, sequenceIndex",
  tourPoints: "++id, angleId, projectId",
});

// ============================================================================
// Database Utilities
// ============================================================================

/**
 * Clear all data from the database
 */
export async function clearDatabase(): Promise<void> {
  await db.projects.clear();
  await db.models.clear();
  await db.maps.clear();
  await db.landmarks.clear();
  await db.paths.clear();
  await db.masterPlans.clear();
  await db.angles.clear();
  await db.buildings.clear();
  await db.floors.clear();
  await db.units.clear();
  await db.tours.clear();
  await db.scenes.clear();
  await db.images.clear();
  await db.autosave.clear();
}

/**
 * Get database storage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentUsed };
  }

  return { usage: 0, quota: 0, percentUsed: 0 };
}

/**
 * Check if storage quota is approaching limit
 */
export async function isStorageNearLimit(
  threshold: number = 80
): Promise<boolean> {
  const { percentUsed } = await getStorageEstimate();
  return percentUsed >= threshold;
}

// ============================================================================
// Export
// ============================================================================

export default db;
