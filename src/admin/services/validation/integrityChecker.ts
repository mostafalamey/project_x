/**
 * Integrity Checker
 * Validates referential integrity across entities and warns about cascade deletes
 */

import { db } from "../persistence/dexieDB";
import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../../types/editor";

// ============================================================================
// Referential Integrity Validation
// ============================================================================

/**
 * Check if a project can be safely deleted
 */
export async function checkProjectIntegrity(
  projectId: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    // Check for dependent models
    const modelCount = await db.models
      .where("projectId")
      .equals(projectId)
      .count();
    if (modelCount > 0) {
      warnings.push({
        field: "project",
        message: `Deleting this project will also delete ${modelCount} apartment model(s)`,
        code: "CASCADE_DELETE_MODELS",
      });
    }

    // Check for dependent maps
    const mapCount = await db.maps.where("projectId").equals(projectId).count();
    if (mapCount > 0) {
      warnings.push({
        field: "project",
        message: `Deleting this project will also delete ${mapCount} map(s)`,
        code: "CASCADE_DELETE_MAPS",
      });
    }

    // Check for dependent landmarks
    const landmarkCount = await db.landmarks
      .where("projectId")
      .equals(projectId)
      .count();
    if (landmarkCount > 0) {
      warnings.push({
        field: "project",
        message: `Deleting this project will also delete ${landmarkCount} landmark(s)`,
        code: "CASCADE_DELETE_LANDMARKS",
      });
    }

    // Check for dependent buildings
    const buildingCount = await db.buildings
      .where("projectId")
      .equals(projectId)
      .count();
    if (buildingCount > 0) {
      warnings.push({
        field: "project",
        message: `Deleting this project will also delete ${buildingCount} building(s)`,
        code: "CASCADE_DELETE_BUILDINGS",
      });
    }

    // Check for dependent tours
    const tourCount = await db.tours
      .where("projectId")
      .equals(projectId)
      .count();
    if (tourCount > 0) {
      warnings.push({
        field: "project",
        message: `Deleting this project will also delete ${tourCount} virtual tour(s)`,
        code: "CASCADE_DELETE_TOURS",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          field: "project",
          message:
            error instanceof Error
              ? error.message
              : "Failed to check project integrity",
          code: "INTEGRITY_CHECK_FAILED",
        },
      ],
      warnings: [],
    };
  }
}

/**
 * Check if a model can be safely deleted
 */
export async function checkModelIntegrity(
  modelId: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    // Check for units using this model
    const unitCount = await db.units.where("modelId").equals(modelId).count();
    if (unitCount > 0) {
      errors.push({
        field: "model",
        message: `Cannot delete model: ${unitCount} unit(s) are using this model type`,
        code: "MODEL_IN_USE",
      });
    }

    // Check for tours linked to this model
    const tourCount = await db.tours.where("modelId").equals(modelId).count();
    if (tourCount > 0) {
      warnings.push({
        field: "model",
        message: `Deleting this model will also delete ${tourCount} virtual tour(s)`,
        code: "CASCADE_DELETE_TOURS",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          field: "model",
          message:
            error instanceof Error
              ? error.message
              : "Failed to check model integrity",
          code: "INTEGRITY_CHECK_FAILED",
        },
      ],
      warnings: [],
    };
  }
}

/**
 * Check if a building can be safely deleted
 */
export async function checkBuildingIntegrity(
  buildingId: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    // Check for dependent floors
    const floorCount = await db.floors
      .where("buildingId")
      .equals(buildingId)
      .count();
    if (floorCount > 0) {
      warnings.push({
        field: "building",
        message: `Deleting this building will also delete ${floorCount} floor(s)`,
        code: "CASCADE_DELETE_FLOORS",
      });
    }

    // Count total units across all floors
    const floors = await db.floors
      .where("buildingId")
      .equals(buildingId)
      .toArray();
    const totalUnits = floors.reduce(
      (sum, floor) => sum + floor.units.length,
      0
    );
    if (totalUnits > 0) {
      warnings.push({
        field: "building",
        message: `Deleting this building will also delete ${totalUnits} unit(s)`,
        code: "CASCADE_DELETE_UNITS",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          field: "building",
          message:
            error instanceof Error
              ? error.message
              : "Failed to check building integrity",
          code: "INTEGRITY_CHECK_FAILED",
        },
      ],
      warnings: [],
    };
  }
}

/**
 * Check if a landmark can be safely deleted
 */
export async function checkLandmarkIntegrity(
  landmarkId: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    // Check for paths connected to this landmark
    const outgoingPaths = await db.paths
      .where("fromLandmarkId")
      .equals(landmarkId)
      .count();
    const incomingPaths = await db.paths
      .where("toLandmarkId")
      .equals(landmarkId)
      .count();
    const totalPaths = outgoingPaths + incomingPaths;

    if (totalPaths > 0) {
      warnings.push({
        field: "landmark",
        message: `Deleting this landmark will also delete ${totalPaths} connected path(s)`,
        code: "CASCADE_DELETE_PATHS",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          field: "landmark",
          message:
            error instanceof Error
              ? error.message
              : "Failed to check landmark integrity",
          code: "INTEGRITY_CHECK_FAILED",
        },
      ],
      warnings: [],
    };
  }
}

/**
 * Validate that a foreign key reference exists
 */
export async function validateForeignKey(
  tableName: string,
  recordId: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  try {
    let exists = false;

    switch (tableName) {
      case "projects":
        exists = (await db.projects.get(recordId)) !== undefined;
        break;
      case "models":
        exists = (await db.models.get(recordId)) !== undefined;
        break;
      case "buildings":
        exists = (await db.buildings.get(recordId)) !== undefined;
        break;
      case "floors":
        exists = (await db.floors.get(recordId)) !== undefined;
        break;
      case "landmarks":
        exists = (await db.landmarks.get(recordId)) !== undefined;
        break;
      default:
        errors.push({
          field: "foreignKey",
          message: `Unknown table: ${tableName}`,
          code: "UNKNOWN_TABLE",
        });
        return { isValid: false, errors, warnings: [] };
    }

    if (!exists) {
      errors.push({
        field: "foreignKey",
        message: `Referenced ${tableName} record not found: ${recordId}`,
        code: "FOREIGN_KEY_NOT_FOUND",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          field: "foreignKey",
          message:
            error instanceof Error
              ? error.message
              : "Failed to validate foreign key",
          code: "VALIDATION_FAILED",
        },
      ],
      warnings: [],
    };
  }
}

/**
 * Check for orphaned records (records with invalid foreign keys)
 */
export async function checkOrphanedRecords(): Promise<{
  models: string[];
  landmarks: string[];
  paths: string[];
  buildings: string[];
  floors: string[];
  units: string[];
}> {
  const orphaned = {
    models: [] as string[],
    landmarks: [] as string[],
    paths: [] as string[],
    buildings: [] as string[],
    floors: [] as string[],
    units: [] as string[],
  };

  try {
    // Check models
    const models = await db.models.toArray();
    const projectIds = new Set((await db.projects.toArray()).map((p) => p.id));
    orphaned.models = models
      .filter((m) => !projectIds.has(m.projectId))
      .map((m) => m.id);

    // Check landmarks
    const landmarks = await db.landmarks.toArray();
    orphaned.landmarks = landmarks
      .filter((l) => !projectIds.has(l.projectId))
      .map((l) => l.id);

    // Check paths
    const paths = await db.paths.toArray();
    const landmarkIds = new Set(landmarks.map((l) => l.id));
    orphaned.paths = paths
      .filter(
        (p) =>
          !landmarkIds.has(p.fromLandmarkId) || !landmarkIds.has(p.toLandmarkId)
      )
      .map((p) => p.id);

    // Check buildings
    const buildings = await db.buildings.toArray();
    orphaned.buildings = buildings
      .filter((b) => !projectIds.has(b.projectId))
      .map((b) => b.id);

    // Check floors
    const floors = await db.floors.toArray();
    const buildingIds = new Set(buildings.map((b) => b.id));
    orphaned.floors = floors
      .filter((f) => !buildingIds.has(f.buildingId))
      .map((f) => f.id);

    // Check units (within floors)
    const modelIds = new Set(models.map((m) => m.id));
    for (const floor of floors) {
      for (const unit of floor.units) {
        if (!modelIds.has(unit.modelId)) {
          orphaned.units.push(unit.id);
        }
      }
    }

    return orphaned;
  } catch (error) {
    console.error("Failed to check orphaned records:", error);
    return orphaned;
  }
}
