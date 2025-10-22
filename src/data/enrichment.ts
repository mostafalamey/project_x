import type { Floor, Model, Unit } from "./types";

/**
 * Enriched unit hotspot with tooltip data derived from unit and model
 */
export type EnrichedUnitHotspot = {
  unitId: string;
  shape: number[];
  tooltip: {
    unitId: string;
    modelId: string;
    areaM2: number;
    bedrooms: number;
    bathrooms: number;
    availability: Unit["availability"];
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
 */
export const enrichFloorData = (
  floor: Floor,
  units: Unit[],
  models: Model[]
): EnrichedFloor => {
  const unitMap = new Map(units.map((u) => [u.id, u]));
  const modelMap = new Map(models.map((m) => [m.id, m]));

  const enrichedUnits: EnrichedUnitHotspot[] = floor.units
    .map((hotspot): EnrichedUnitHotspot | null => {
      const unit = unitMap.get(hotspot.unitId);

      if (!unit) {
        console.warn(
          `Unit ${hotspot.unitId} not found in units data for floor ${floor.id}`
        );
        return null;
      }

      const model = modelMap.get(unit.modelId);

      if (!model) {
        console.warn(
          `Model ${unit.modelId} not found in models data for unit ${unit.id}`
        );
        return null;
      }

      return {
        unitId: hotspot.unitId,
        shape: hotspot.shape,
        tooltip: {
          unitId: unit.id,
          modelId: model.id,
          areaM2: model.areaM2,
          bedrooms: model.bedrooms,
          bathrooms: model.bathrooms,
          availability: unit.availability,
          price: unit.price,
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
