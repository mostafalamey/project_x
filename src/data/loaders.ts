import { validateWithSchema, type SchemaKey } from "./schemas";
import type {
  Building,
  Floor,
  Landmark,
  MasterPlan,
  Model,
  Tour,
  Unit,
} from "./types";

const ensureAbsolutePath = (path: string): string => {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  // Prepend base URL from Vite config
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

const fetchJson = async <T>(path: string): Promise<T> => {
  const resourcePath = ensureAbsolutePath(path);
  const response = await fetch(resourcePath, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load JSON from ${resourcePath}: ${response.statusText}`
    );
  }

  return (await response.json()) as T;
};

const maybeValidate = async <T>(schemaKey: SchemaKey, data: T): Promise<T> => {
  if (!import.meta.env.DEV) {
    return data;
  }

  return validateWithSchema<T>(schemaKey, data);
};

export const loadLandmarks = async (): Promise<Landmark[]> => {
  const data = await fetchJson<Landmark[]>("/data/landmarks.json");

  return import.meta.env.DEV ? maybeValidate("landmarks", data) : data;
};

export const loadMasterPlan = async (): Promise<MasterPlan> => {
  const data = await fetchJson<MasterPlan>("/data/masterplan/buildings.json");

  return import.meta.env.DEV ? maybeValidate("masterplan", data) : data;
};

export const loadFloor = async (
  buildingId: string,
  floorId: string
): Promise<Floor> => {
  const data = await fetchJson<Floor>(
    `/data/buildings/${buildingId}/floors/${floorId}.json`
  );

  return import.meta.env.DEV ? maybeValidate("floor", data) : data;
};

export const loadModels = async (): Promise<Model[]> => {
  const models = await fetchJson<Model[]>("/data/models.json");

  if (!import.meta.env.DEV) {
    return models;
  }

  const validatedModels = await Promise.all(
    models.map((model) => maybeValidate("model", model))
  );

  return validatedModels;
};

export const loadUnits = async (): Promise<Unit[]> => {
  const units = await fetchJson<Unit[]>("/data/units.json");

  if (!import.meta.env.DEV) {
    return units;
  }

  const validatedUnits = await Promise.all(
    units.map((unit) => maybeValidate("unit", unit))
  );

  return validatedUnits;
};

export const loadTour = async (tourId: string): Promise<Tour> => {
  const data = await fetchJson<Tour>(`/data/tours/${tourId}/tour.json`);

  return import.meta.env.DEV ? maybeValidate("tour", data) : data;
};

export const loadBuilding = async (buildingId: string): Promise<Building> => {
  const data = await fetchJson<Building>(
    `/data/buildings/${buildingId}/building.json`
  );

  return import.meta.env.DEV ? maybeValidate("building", data) : data;
};
