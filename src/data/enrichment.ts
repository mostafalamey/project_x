import type { Floor, Model, Unit } from "./types";

/**
 * Enriched unit hotspot with tooltip data derived from unit and model
 */
export type EnrichedUnitHotspot = {
  unitId: string;
  shape: number[];
  tooltip: {
    unitId: string;
    unitNumber: string;
    modelId: string;
    modelTitle: string;
    areaM2: number;
    bedrooms: number;
    bathrooms: number;
    availability: "available" | "reserved" | "sold";
    price?: number;
  };
};

/**
 * Floor data with enriched unit hotspots
 */
export type EnrichedFloor = Omit<Floor, "units"> & {
  units: EnrichedUnitHotspot[];
};

/**
 * Enriches a floor's unit hotspots with data from units and models
 * Now the floor JSON contains inline unit data, so we fetch model details to enrich
 */
export const enrichFloorData = (
  floor: Floor,
  units: Unit[],
  models: Model[]
): EnrichedFloor => {
  const modelMap = new Map(models.map((m) => [m.id, m]));

  const enrichedUnits: EnrichedUnitHotspot[] = floor.units
    .map((hotspot): EnrichedUnitHotspot | null => {
      // The floor now contains inline unit data
      const model = modelMap.get(hotspot.modelId);

      if (!model) {
        console.warn(
          `Model ${hotspot.modelId} not found in models data for unit ${hotspot.unitNumber} on floor ${floor.id}`
        );
        // Still return the unit with basic info even if model not found
        return {
          unitId: `${floor.buildingId}-${floor.floorNumber}-${hotspot.unitNumber}`,
          shape: hotspot.polygon,
          tooltip: {
            unitId: `${floor.buildingId}-${floor.floorNumber}-${hotspot.unitNumber}`,
            unitNumber: hotspot.unitNumber,
            modelId: hotspot.modelId,
            modelTitle: hotspot.modelTitle,
            areaM2: 0, // Default if model not found
            bedrooms: 0,
            bathrooms: 0,
            availability: hotspot.availability,
            price: hotspot.pricing.price,
          },
        };
      }

      return {
        unitId: `${floor.buildingId}-${floor.floorNumber}-${hotspot.unitNumber}`,
        shape: hotspot.polygon,
        tooltip: {
          unitId: `${floor.buildingId}-${floor.floorNumber}-${hotspot.unitNumber}`,
          unitNumber: hotspot.unitNumber,
          modelId: model.id,
          modelTitle: hotspot.modelTitle,
          areaM2: model.areaM2,
          bedrooms: model.bedrooms,
          bathrooms: model.bathrooms,
          availability: hotspot.availability,
          price: hotspot.pricing.price,
        },
      };
    })
    .filter((u): u is EnrichedUnitHotspot => u !== null);

  return {
    ...floor,
    units: enrichedUnits,
  };
};

/**
 * Gets the tour path for a unit by looking up its model
 */
export const getUnitTourPath = (unit: Unit, models: Model[]): string | null => {
  const model = models.find((m) => m.id === unit.modelId);
  return model?.tourPath ?? null;
};

/**
 * Gets the tour path by model ID directly
 */
export const getTourPathByModelId = (
  modelId: string,
  models: Model[]
): string | null => {
  const model = models.find((m) => m.id === modelId);
  return model?.tourPath ?? null;
};

/**
 * Checks if a tour exists for a given model ID by attempting to fetch it
 * This is useful when tourPath in models.json is null but tour file exists
 */
export const checkTourExists = async (modelId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/data/tours/${modelId}/tour.json`);

    // Check if response is ok and actually contains JSON
    if (!response.ok) {
      return false;
    }

    // Try to parse as JSON to verify it's a valid tour file
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return false;
    }

    const data = await response.json();
    // Verify it has the basic structure of a tour
    return data && Array.isArray(data.scenes) && data.scenes.length > 0;
  } catch (error) {
    // If fetch fails or JSON parsing fails, tour doesn't exist
    console.log(`Tour file check failed for ${modelId}:`, error);
    return false;
  }
};

/**
 * Gets the tour ID for a model, either from tourPath or by checking if tour exists
 */
export const getTourIdForModel = async (
  modelId: string,
  models: Model[]
): Promise<string | null> => {
  // First check if model has tourPath set
  const tourPath = getTourPathByModelId(modelId, models);
  if (tourPath) {
    const tourId = deriveTourId(tourPath);
    console.log(
      `Model ${modelId} has tourPath: ${tourPath} -> tourId: ${tourId}`
    );
    return tourId;
  }

  // If no tourPath, check if tour file exists with modelId as tourId
  console.log(`Model ${modelId} has no tourPath, checking for tour file...`);
  const tourExists = await checkTourExists(modelId);
  console.log(`Model ${modelId} tour file exists: ${tourExists}`);
  return tourExists ? modelId : null;
};

/**
 * Derives tour ID from a tour path
 */
export const deriveTourId = (tourPath: string): string | null => {
  if (!tourPath) {
    return null;
  }

  const segments = tourPath.split("/").filter(Boolean);

  if (!segments.length) {
    return null;
  }

  const toursIndex = segments.indexOf("tours");

  if (toursIndex !== -1 && toursIndex + 1 < segments.length) {
    return segments[toursIndex + 1];
  }

  const penultimate = segments[segments.length - 2];
  return penultimate ?? segments.at(-1) ?? null;
};

/**
 * Enriched unit with model data combined
 */
export type EnrichedUnit = Unit & {
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  tourPath: string | null;
};

/**
 * Enriches units with their model data
 */
export const enrichUnits = (units: Unit[], models: Model[]): EnrichedUnit[] => {
  const modelMap = new Map(models.map((m) => [m.id, m]));

  return units
    .map((unit): EnrichedUnit | null => {
      const model = modelMap.get(unit.modelId);

      if (!model) {
        console.warn(`Model ${unit.modelId} not found for unit ${unit.id}`);
        return null;
      }

      return {
        ...unit,
        areaM2: model.areaM2,
        bedrooms: model.bedrooms,
        bathrooms: model.bathrooms,
        tourPath: model.tourPath,
      };
    })
    .filter((u): u is EnrichedUnit => u !== null);
};

/**
 * Unit filter criteria
 */
export type UnitFilters = {
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  availability?: "Available" | "Reserved" | "Sold";
};

/**
 * Filters enriched units based on criteria
 */
export const filterUnits = (
  units: EnrichedUnit[],
  filters: UnitFilters
): EnrichedUnit[] => {
  return units.filter((unit) => {
    if (filters.minArea !== undefined && unit.areaM2 < filters.minArea) {
      return false;
    }

    if (filters.maxArea !== undefined && unit.areaM2 > filters.maxArea) {
      return false;
    }

    if (filters.bedrooms !== undefined && unit.bedrooms !== filters.bedrooms) {
      return false;
    }

    if (
      filters.bathrooms !== undefined &&
      unit.bathrooms !== filters.bathrooms
    ) {
      return false;
    }

    if (
      filters.availability !== undefined &&
      unit.availability !== filters.availability
    ) {
      return false;
    }

    return true;
  });
};

/**
 * Model filter criteria (similar to UnitFilters but without availability)
 */
export type ModelFilters = {
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
};

/**
 * Filters models based on criteria
 */
export const filterModels = (
  models: Model[],
  filters: ModelFilters
): Model[] => {
  return models.filter((model) => {
    if (filters.minArea !== undefined && model.areaM2 < filters.minArea) {
      return false;
    }

    if (filters.maxArea !== undefined && model.areaM2 > filters.maxArea) {
      return false;
    }

    if (filters.bedrooms !== undefined && model.bedrooms !== filters.bedrooms) {
      return false;
    }

    if (
      filters.bathrooms !== undefined &&
      model.bathrooms !== filters.bathrooms
    ) {
      return false;
    }

    return true;
  });
};
