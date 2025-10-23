export type Point2D = {
  x: number;
  y: number;
};

export type Polygon = number[];

export type MapData = {
  image: string;
  landmarks: Landmark[];
};

export type Landmark = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  distanceM?: number;
  timeMin?: number;
  coords: Point2D | Polygon;
  type: "complex" | "poi";
};

export type MasterPlan = {
  angles: MasterPlanAngle[];
  buildings: MasterPlanBuilding[];
};

export type MasterPlanAngle = {
  id: string;
  image: string;
  sequenceToNext?: MasterPlanSequence;
  hotspots: MasterPlanHotspot[];
};

export type MasterPlanSequence = {
  folder: string;
  frameCount: number;
  filenamePattern?: string;
};

export type MasterPlanHotspot = {
  buildingId: string;
  polygons: Polygon[];
};

export type MasterPlanBuilding = {
  id: string;
  name: string;
  summary: {
    totalFloors: number;
    availableUnits: number;
  };
};

export type Building = {
  id: string;
  name: string;
  elevationImage: string;
  floors: BuildingFloor[];
};

export type BuildingFloor = {
  id: string;
  number: number;
  planImage: string;
  elevationPolygons?: Polygon[];
};

export type ModelRotation360 = {
  folder: string;
  frameCount: number;
  filenamePattern?: string;
};

export type Model = {
  id: string;
  title?: string;
  description?: string;
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  tourPath: string | null;
  imagePath: string;
  rotation360?: ModelRotation360;
};

export type Floor = {
  id: string;
  buildingId: string;
  number: number;
  planImage: string;
  units: UnitHotspot[];
  elevationPolygons?: Polygon[];
};

export type UnitHotspot = {
  unitId: string;
  shape: Polygon;
};

export type Unit = {
  id: string;
  modelId: string;
  buildingId: string;
  floorId: string;
  availability: "Available" | "Reserved" | "Sold";
  price?: number;
};

export type PanoLink = {
  target: string;
  x: number;
  y: number;
};

export type PanoScene = {
  id: string;
  image: string;
  links?: PanoLink[];
  initialView?: {
    yaw?: number;
    pitch?: number;
    fov?: number;
  };
};

export type Tour = {
  modelId?: string | null;
  startSceneId?: string;
  scenes: PanoScene[];
};
