/**
 * Config Validator Service
 * Validates imported configuration against schemas
 */

import type {
  ProjectConfig,
  Model,
  Landmark,
  MasterPlanConfig,
} from "../../types/admin-config";

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate entire project configuration
 */
export function validateProjectConfig(config: {
  project: any;
  models: any[];
  landmarks: any[];
  masterplan: any;
  buildings: any[];
  floors: any[];
  tours: any[];
}): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate project settings
  const projectErrors = validateProject(config.project);
  errors.push(...projectErrors);

  // Validate models
  const modelsErrors = validateModels(config.models);
  errors.push(...modelsErrors);

  // Validate landmarks
  const landmarksErrors = validateLandmarks(config.landmarks);
  errors.push(...landmarksErrors);

  // Validate master plan
  const masterplanErrors = validateMasterPlan(config.masterplan);
  errors.push(...masterplanErrors);

  // Validate buildings
  const buildingsErrors = validateBuildings(config.buildings);
  errors.push(...buildingsErrors);

  // Validate floors
  const floorsErrors = validateFloors(config.floors);
  errors.push(...floorsErrors);

  // Validate tours
  const toursErrors = validateTours(config.tours);
  errors.push(...toursErrors);

  // Check for missing references (warnings)
  const referenceWarnings = validateReferences(config);
  warnings.push(...referenceWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Individual Validators
// ============================================================================

/**
 * Validate project settings
 */
function validateProject(project: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!project) {
    errors.push({
      field: "project",
      message: "Project configuration is required",
    });
    return errors;
  }

  if (!project.name || typeof project.name !== "string") {
    errors.push({ field: "project.name", message: "Project name is required" });
  }

  if (!project.slug || typeof project.slug !== "string") {
    errors.push({ field: "project.slug", message: "Project slug is required" });
  }

  return errors;
}

/**
 * Validate models array
 */
function validateModels(models: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(models)) {
    errors.push({ field: "models", message: "Models must be an array" });
    return errors;
  }

  models.forEach((model, index) => {
    if (!model.id) {
      errors.push({
        field: `models[${index}].id`,
        message: "Model ID is required",
      });
    }

    if (!model.name) {
      errors.push({
        field: `models[${index}].name`,
        message: "Model name is required",
      });
    }

    if (model.bedrooms !== undefined && typeof model.bedrooms !== "number") {
      errors.push({
        field: `models[${index}].bedrooms`,
        message: "Bedrooms must be a number",
      });
    }

    if (model.bathrooms !== undefined && typeof model.bathrooms !== "number") {
      errors.push({
        field: `models[${index}].bathrooms`,
        message: "Bathrooms must be a number",
      });
    }
  });

  return errors;
}

/**
 * Validate landmarks array
 */
function validateLandmarks(landmarks: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(landmarks)) {
    errors.push({ field: "landmarks", message: "Landmarks must be an array" });
    return errors;
  }

  landmarks.forEach((landmark, index) => {
    if (!landmark.id) {
      errors.push({
        field: `landmarks[${index}].id`,
        message: "Landmark ID is required",
      });
    }

    if (!landmark.name) {
      errors.push({
        field: `landmarks[${index}].name`,
        message: "Landmark name is required",
      });
    }

    if (
      !landmark.position ||
      typeof landmark.position.x !== "number" ||
      typeof landmark.position.y !== "number"
    ) {
      errors.push({
        field: `landmarks[${index}].position`,
        message: "Valid position (x, y) is required",
      });
    }
  });

  return errors;
}

/**
 * Validate master plan configuration
 */
function validateMasterPlan(masterplan: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!masterplan) {
    // Master plan is optional
    return errors;
  }

  if (masterplan.angles && !Array.isArray(masterplan.angles)) {
    errors.push({
      field: "masterplan.angles",
      message: "Angles must be an array",
    });
  }

  return errors;
}

/**
 * Validate buildings array
 */
function validateBuildings(buildings: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(buildings)) {
    errors.push({ field: "buildings", message: "Buildings must be an array" });
    return errors;
  }

  buildings.forEach((building, index) => {
    if (!building.id) {
      errors.push({
        field: `buildings[${index}].id`,
        message: "Building ID is required",
      });
    }

    if (!building.name) {
      errors.push({
        field: `buildings[${index}].name`,
        message: "Building name is required",
      });
    }
  });

  return errors;
}

/**
 * Validate floors array
 */
function validateFloors(floors: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(floors)) {
    errors.push({ field: "floors", message: "Floors must be an array" });
    return errors;
  }

  floors.forEach((floor, index) => {
    if (!floor.id) {
      errors.push({
        field: `floors[${index}].id`,
        message: "Floor ID is required",
      });
    }

    if (!floor.name) {
      errors.push({
        field: `floors[${index}].name`,
        message: "Floor name is required",
      });
    }

    if (!floor.buildingId) {
      errors.push({
        field: `floors[${index}].buildingId`,
        message: "Building ID reference is required",
      });
    }
  });

  return errors;
}

/**
 * Validate tours array
 */
function validateTours(tours: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(tours)) {
    errors.push({ field: "tours", message: "Tours must be an array" });
    return errors;
  }

  tours.forEach((tour, index) => {
    if (!tour.id) {
      errors.push({
        field: `tours[${index}].id`,
        message: "Tour ID is required",
      });
    }

    if (!tour.name) {
      errors.push({
        field: `tours[${index}].name`,
        message: "Tour name is required",
      });
    }
  });

  return errors;
}

/**
 * Validate cross-references between entities
 */
function validateReferences(config: {
  project: any;
  models: any[];
  buildings: any[];
  floors: any[];
  tours: any[];
}): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Check floor -> building references
  const buildingIds = new Set(config.buildings.map((b) => b.id));
  config.floors.forEach((floor, index) => {
    if (floor.buildingId && !buildingIds.has(floor.buildingId)) {
      warnings.push({
        field: `floors[${index}].buildingId`,
        message: `References non-existent building: ${floor.buildingId}`,
        value: floor.buildingId,
      });
    }
  });

  // Check unit -> model references
  const modelIds = new Set(config.models.map((m) => m.id));
  config.floors.forEach((floor, floorIndex) => {
    if (floor.units) {
      floor.units.forEach((unit: any, unitIndex: number) => {
        if (unit.modelId && !modelIds.has(unit.modelId)) {
          warnings.push({
            field: `floors[${floorIndex}].units[${unitIndex}].modelId`,
            message: `References non-existent model: ${unit.modelId}`,
            value: unit.modelId,
          });
        }
      });
    }
  });

  return warnings;
}
