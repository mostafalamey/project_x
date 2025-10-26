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
  category?: string;
  description?: string;
  image?: string;
  distanceK?: number;
  timeMin?: number;
  coords: Point2D | Polygon;
  path?: Point2D[] | Polygon;
  pathStyle?: {
    stroke?: string;
    strokeWidth?: number;
  };
  type: "complex" | "poi";
};

export type MasterPlan = {
  angles: MasterPlanAngle[];
  buildings: MasterPlanBuilding[];
  tourPoints?: MasterPlanTourPoint[];
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
    totalFloors?: number;
    availableUnits?: number;
  };
};

export type MasterPlanTourPoint = {
  id: string;
  name: string;
  positions: {
    angleIndex: number;
    x: number;
    y: number;
  }[];
  panoramicImage: string;
  initialView: {
    yaw: number;
    pitch: number;
    fov: number;
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
  name: string;
  floorNumber: number;
  buildingId: string;
  buildingName: string;
  floorPlanImage: string;
  units: UnitHotspot[];
  elevationPolygons?: Polygon[];
};

export type UnitHotspot = {
  unitNumber: string;
  modelId: string;
  modelTitle: string;
  availability: "available" | "reserved" | "sold";
  pricing: {
    price: number;
  };
  polygon: Polygon;
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

export type PanoHotspot = {
  id: string;
  targetSceneId: string;
  position: {
    yaw: number;
    pitch: number;
  };
  icon: string;
};

export type PanoramaImage = {
  url: string;
  filename: string;
};

export type PanoScene = {
  id: string;
  image?: string; // For old format
  panoramaImage?: PanoramaImage; // For new format
  name?: string;
  links?: PanoLink[]; // For old format
  hotspots?: PanoHotspot[]; // For new format
  initialView?: {
    yaw?: number;
    pitch?: number;
    fov?: number;
  };
};

export type TourMetadata = {
  exportDate: string;
  version: string;
  sceneCount: number;
  totalHotspots: number;
};

export type Tour = {
  tourId?: string; // New format
  modelId?: string | null;
  projectId?: string; // New format
  startSceneId?: string; // Old format
  startingSceneId?: string; // New format
  scenes: PanoScene[];
  metadata?: TourMetadata; // New format
};
