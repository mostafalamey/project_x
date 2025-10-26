# Data Model: Admin Configuration Dashboard

**Date**: 2025-10-24  
**Feature**: Admin Configuration Dashboard  
**Phase**: 1 - Data Model & Entity Design

## Overview

This document defines the data model for the Admin Configuration Dashboard, including all entities, relationships, state management structure, and persistence strategy. The model is designed to support the hierarchical structure: Project → Models → Map → Master Plan → Buildings → Floors → Units.

---

## Entity Definitions

### 1. Project Configuration

Top-level entity containing global project settings and metadata.

```typescript
interface ProjectConfig {
  id: string; // UUID
  name: string; // Project display name
  slug: string; // URL-friendly identifier
  developer: {
    name: string;
    logo?: string; // Base64 or URL
    contact: {
      email?: string;
      phone?: string;
      website?: string;
    };
  };
  metadata: {
    location?: string;
    description?: string;
    completionDate?: string; // ISO 8601
    totalUnits?: number;
  };
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  version: string; // Semantic version (e.g., "1.0.0")
}
```

**Relationships**:

- One Project has many Models
- One Project has one Map
- One Project has one Master Plan
- One Project has many Buildings

**Validation Rules**:

- `name`: Required, 3-100 characters
- `slug`: Required, alphanumeric + hyphens only, unique
- `developer.name`: Required
- `version`: Must follow semver format

---

### 2. Model (Apartment Type)

Represents an apartment model/floor plan type with associated media.

```typescript
interface Model {
  id: string; // Unique identifier (e.g., "A-1", "B-2")
  projectId: string; // Foreign key to Project
  title: string; // Display name (e.g., "Modern 3-Bedroom Apartment")
  description: string; // Rich text description
  specs: {
    areaM2: number; // Floor area in square meters
    bedrooms: number; // Number of bedrooms
    bathrooms: number; // Number of bathrooms
  };
  media: {
    thumbnail: ImageRef; // Main model image
    rotation360?: Rotation360Config; // Optional 360° rotation
    virtualTour?: string; // Reference to tour ID
  };
  pricing?: {
    startingPrice?: number;
    currency?: string; // ISO 4217 code
  };
  availability: "available" | "sold-out" | "coming-soon";
  displayOrder: number; // Sort order in lists
  createdAt: string;
  updatedAt: string;
}

interface Rotation360Config {
  frameCount: number; // Number of rotation frames
  filenamePattern: string; // e.g., "model-A-1_{index}.jpg"
  folder: string; // Path to frame images
  frames: ImageRef[]; // Array of frame image references
}

interface ImageRef {
  id: string; // UUID
  filename: string; // Original filename
  blob?: Blob; // Image data (in IndexedDB)
  url?: string; // Object URL or external URL
  width: number; // Image dimensions
  height: number;
  size: number; // File size in bytes
  mimeType: "image/jpeg" | "image/png";
  uploadedAt: string;
}
```

**Relationships**:

- Many Models belong to one Project
- Many Units reference one Model

**Validation Rules**:

- `id`: Required, unique within project
- `title`: Required, 3-200 characters
- `specs.areaM2`: Required, > 0
- `specs.bedrooms`: Required, >= 0
- `specs.bathrooms`: Required, >= 0
- `media.thumbnail`: Required
- `rotation360.frameCount`: If present, must be >= 12
- `rotation360.frames`: If present, all frames must have identical dimensions

---

### 3. Map Configuration

Site map with landmarks and pathways.

```typescript
interface MapConfig {
  id: string;
  projectId: string;
  backgroundImage: ImageRef; // Site map image
  landmarks: Landmark[];
  paths: LandmarkPath[];
  viewport: {
    width: number; // Image native width
    height: number; // Image native height
  };
  createdAt: string;
  updatedAt: string;
}

interface Landmark {
  id: string;
  type: "poi" | "complex"; // Point of Interest or Main Complex
  name: string;
  description?: string;
  geometry: CircleGeometry | PolygonGeometry;
  metadata?: {
    distanceM?: number; // Distance from complex
    timeMin?: number; // Travel time in minutes
    category?: string; // e.g., "transport", "shopping", "education"
  };
}

interface CircleGeometry {
  type: "circle";
  center: Point; // { x: number, y: number }
  radius: number; // In pixels
}

interface PolygonGeometry {
  type: "polygon";
  vertices: Point[]; // Array of { x, y } coordinates
  closed: true; // Always closed for landmarks
}

interface LandmarkPath {
  id: string;
  fromLandmarkId: string; // Must be 'complex' type
  toLandmarkId: string; // Must be 'poi' type
  pathData: string; // SVG path d attribute
  style?: {
    stroke?: string; // Default: "#000000"
    strokeWidth?: number; // Default: 2
    strokeDasharray?: string; // e.g., "5,5" for dashed
  };
}
```

**Relationships**:

- One Project has one Map
- One Map has many Landmarks
- One Map has many Paths (connecting landmarks)

**Validation Rules**:

- Must have exactly one landmark with `type: 'complex'`
- POI landmarks must use CircleGeometry
- Complex landmark must use PolygonGeometry
- Polygon must have >= 3 vertices
- Path `fromLandmarkId` must reference the complex
- Path `toLandmarkId` must reference a POI
- All coordinates must be within image viewport bounds

---

### 4. Master Plan Configuration

Master plan with multiple viewing angles and building hotspots.

```typescript
interface MasterPlanConfig {
  id: string;
  projectId: string;
  angles: AngleView[];
  buildings: BuildingReference[]; // Building entities created here
  createdAt: string;
  updatedAt: string;
}

interface AngleView {
  id: string; // e.g., "angle-1", "angle-2"
  backgroundImage: ImageRef;
  sequenceIndex: number; // Order in rotation
  hotspots: BuildingHotspot[]; // Hotspots for buildings on this angle
  transitionToNext?: TransitionSequence;
}

interface BuildingHotspot {
  id: string;
  buildingId: string; // References Building entity
  geometry: PolygonGeometry; // Clickable area on this angle
  label?: string; // Optional label overlay
}

interface TransitionSequence {
  folder: string; // Path to transition frames
  frameCount: number; // Number of frames
  filenamePattern: string; // e.g., "frame-{index}.jpg"
  frames: ImageRef[]; // Transition frame images
}

interface BuildingReference {
  id: string; // Building UUID
  name: string; // Building name/number
  displayName?: string; // Optional display override
}
```

**Relationships**:

- One Project has one Master Plan
- One Master Plan has many Angles
- One Master Plan creates many Buildings
- Each Angle has many BuildingHotspots
- Each BuildingHotspot references one Building

**Validation Rules**:

- Must have >= 1 angle
- Angles must have sequential `sequenceIndex` (0, 1, 2, ...)
- Each building must have >= 1 hotspot per angle (complete coverage)
- Hotspot geometry must be within angle image bounds
- Transition frames (if present) must match frameCount

---

### 5. Building Configuration

Building entity with exterior image and floor hotspots.

```typescript
interface BuildingConfig {
  id: string; // UUID (from Master Plan BuildingReference)
  projectId: string;
  name: string; // Building identifier
  exteriorImage?: ImageRef; // Building elevation/exterior view
  floors: FloorReference[]; // Floors created in this building
  metadata?: {
    address?: string;
    yearBuilt?: number;
    totalFloors?: number;
    features?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface FloorReference {
  id: string; // Floor UUID
  name: string; // e.g., "Ground Floor", "Floor 1"
  floorNumber: number; // Numeric level (0 = ground)
  hotspot?: PolygonGeometry; // Hotspot on building exterior image
}
```

**Relationships**:

- One Building is created in Master Plan
- One Building has one exterior image
- One Building has many Floors

**Validation Rules**:

- `id` must match a BuildingReference from Master Plan
- Floor numbers must be unique within building
- Floor hotspot (if present) must be within exterior image bounds

---

### 6. Floor Configuration

Floor entity with floor plan image and unit hotspots.

```typescript
interface FloorConfig {
  id: string; // UUID (from Building FloorReference)
  buildingId: string; // Foreign key to Building
  projectId: string;
  name: string; // Floor identifier
  floorNumber: number;
  floorPlanImage?: ImageRef; // Floor plan drawing
  units: UnitHotspot[]; // Units on this floor
  metadata?: {
    ceilingHeight?: number;
    totalArea?: number;
    amenities?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface UnitHotspot {
  id: string; // UUID
  unitNumber: string; // e.g., "101", "A-1-01"
  modelId: string; // Foreign key to Model
  geometry: PolygonGeometry; // Unit boundary on floor plan
  availability: "available" | "reserved" | "sold";
  pricing?: {
    price?: number;
    currency?: string;
  };
  customizations?: {
    note?: string;
    upgrades?: string[];
  };
}
```

**Relationships**:

- One Floor is created in Building
- One Floor has one floor plan image
- One Floor has many Units
- Each Unit references one Model

**Validation Rules**:

- `id` must match a FloorReference from Building
- Unit numbers must be unique within floor
- `modelId` must reference an existing Model
- Unit geometry must be within floor plan image bounds
- Unit geometries should not overlap (warning, not error)

---

### 7. Virtual Tour Configuration

360° panoramic tour for a model.

```typescript
interface TourConfig {
  id: string;
  projectId: string;
  modelId: string; // Foreign key to Model
  name: string;
  startingSceneId: string; // Initial scene to display
  scenes: TourScene[];
  createdAt: string;
  updatedAt: string;
}

interface TourScene {
  id: string;
  name: string;
  panoramaImage: ImageRef; // Equirectangular 360° image
  hotspots: SceneHotspot[];
  metadata?: {
    captureDate?: string;
    photographer?: string;
    viewpoint?: string; // e.g., "Living Room", "Master Bedroom"
  };
}

interface SceneHotspot {
  id: string;
  targetSceneId: string; // Foreign key to TourScene
  position: {
    yaw: number; // Horizontal angle (-180 to 180)
    pitch: number; // Vertical angle (-90 to 90)
  };
  tooltip?: string;
  icon?: "arrow" | "door" | "info" | "custom";
  customIcon?: string; // SVG or image URL for custom icon
}
```

**Relationships**:

- One Model has zero or one Tour
- One Tour has many Scenes
- Each Scene has many Hotspots
- Each Hotspot references another Scene (circular graph)

**Validation Rules**:

- `startingSceneId` must reference an existing scene
- Scene hotspot `targetSceneId` must reference an existing scene
- Yaw must be in range [-180, 180]
- Pitch must be in range [-90, 90]
- Tour graph must be connected (all scenes reachable from start)

---

## State Management Architecture

### Zustand Store Structure

```typescript
// 1. Project Store (Global Settings)
interface ProjectStore {
  config: ProjectConfig | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProject: (id: string) => Promise<void>;
  createProject: (config: Partial<ProjectConfig>) => Promise<void>;
  updateProject: (updates: Partial<ProjectConfig>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

// 2. Models Store
interface ModelsStore {
  models: Model[];
  selectedModelId: string | null;

  // Actions
  loadModels: (projectId: string) => Promise<void>;
  addModel: (
    model: Omit<Model, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateModel: (id: string, updates: Partial<Model>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  reorderModels: (modelIds: string[]) => Promise<void>;
  selectModel: (id: string) => void;

  // 360° Rotation
  add360Rotation: (modelId: string, config: Rotation360Config) => Promise<void>;
  update360Frame: (
    modelId: string,
    frameIndex: number,
    image: ImageRef
  ) => Promise<void>;
}

// 3. Map Store
interface MapStore {
  config: MapConfig | null;
  selectedLandmarkId: string | null;
  selectedPathId: string | null;
  drawingMode: "none" | "poi" | "complex" | "path";

  // Actions
  loadMap: (projectId: string) => Promise<void>;
  updateBackgroundImage: (image: ImageRef) => Promise<void>;
  addLandmark: (landmark: Omit<Landmark, "id">) => Promise<void>;
  updateLandmark: (id: string, updates: Partial<Landmark>) => Promise<void>;
  deleteLandmark: (id: string) => Promise<void>;
  addPath: (path: Omit<LandmarkPath, "id">) => Promise<void>;
  updatePath: (id: string, updates: Partial<LandmarkPath>) => Promise<void>;
  deletePath: (id: string) => Promise<void>;
  setDrawingMode: (mode: MapStore["drawingMode"]) => void;
  selectLandmark: (id: string | null) => void;
}

// 4. Master Plan Store
interface MasterPlanStore {
  config: MasterPlanConfig | null;
  currentAngleIndex: number;
  selectedHotspotId: string | null;
  drawingMode: "none" | "building-hotspot";

  // Actions
  loadMasterPlan: (projectId: string) => Promise<void>;
  createBuilding: (building: Omit<BuildingReference, "id">) => Promise<void>;
  deleteBuilding: (id: string) => Promise<void>;
  addAngle: (angle: Omit<AngleView, "id" | "sequenceIndex">) => Promise<void>;
  updateAngle: (id: string, updates: Partial<AngleView>) => Promise<void>;
  deleteAngle: (id: string) => Promise<void>;
  addBuildingHotspot: (
    angleId: string,
    hotspot: Omit<BuildingHotspot, "id">
  ) => Promise<void>;
  updateHotspot: (
    angleId: string,
    hotspotId: string,
    updates: Partial<BuildingHotspot>
  ) => Promise<void>;
  deleteHotspot: (angleId: string, hotspotId: string) => Promise<void>;
  addTransition: (
    angleId: string,
    transition: TransitionSequence
  ) => Promise<void>;
  setCurrentAngle: (index: number) => void;
  setDrawingMode: (mode: MasterPlanStore["drawingMode"]) => void;
}

// 5. Buildings Store
interface BuildingsStore {
  buildings: BuildingConfig[];
  selectedBuildingId: string | null;

  // Actions
  loadBuildings: (projectId: string) => Promise<void>;
  selectBuilding: (id: string | null) => void;
  updateBuilding: (
    id: string,
    updates: Partial<BuildingConfig>
  ) => Promise<void>;
  updateExteriorImage: (id: string, image: ImageRef) => Promise<void>;
  createFloor: (
    buildingId: string,
    floor: Omit<FloorReference, "id">
  ) => Promise<void>;
  updateFloorHotspot: (
    buildingId: string,
    floorId: string,
    hotspot: PolygonGeometry
  ) => Promise<void>;
  deleteFloor: (buildingId: string, floorId: string) => Promise<void>;
}

// 6. Floors Store
interface FloorsStore {
  floors: FloorConfig[];
  selectedFloorId: string | null;
  drawingMode: "none" | "unit-hotspot";

  // Actions
  loadFloors: (buildingId: string) => Promise<void>;
  selectFloor: (id: string | null) => void;
  updateFloor: (id: string, updates: Partial<FloorConfig>) => Promise<void>;
  updateFloorPlanImage: (id: string, image: ImageRef) => Promise<void>;
  addUnit: (floorId: string, unit: Omit<UnitHotspot, "id">) => Promise<void>;
  updateUnit: (
    floorId: string,
    unitId: string,
    updates: Partial<UnitHotspot>
  ) => Promise<void>;
  deleteUnit: (floorId: string, unitId: string) => Promise<void>;
  setDrawingMode: (mode: FloorsStore["drawingMode"]) => void;
}

// 7. Canvas Store (UI State Only)
interface CanvasStore {
  scale: number;
  offset: Point;
  selectedShapeId: string | null;
  isDrawing: boolean;
  currentTool: "select" | "polygon" | "circle" | "path";
  tempPoints: Point[]; // Points while drawing
  hoveredShapeId: string | null;

  // Actions (pure UI, no persistence)
  setScale: (scale: number) => void;
  setOffset: (offset: Point) => void;
  selectShape: (id: string | null) => void;
  setTool: (tool: CanvasStore["currentTool"]) => void;
  startDrawing: () => void;
  addPoint: (point: Point) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  setHoveredShape: (id: string | null) => void;
  resetCanvas: () => void;
}
```

---

## Persistence Strategy

### IndexedDB Schema (Dexie.js)

```typescript
const db = new Dexie("AdminConfigDB");

db.version(1).stores({
  // Core entities
  projects: "++id, slug, updatedAt",
  models: "++id, projectId, displayOrder",
  maps: "++id, projectId",
  landmarks: "++id, mapId, type",
  paths: "++id, mapId",
  masterPlans: "++id, projectId",
  angles: "++id, masterPlanId, sequenceIndex",
  buildings: "++id, projectId, name",
  floors: "++id, buildingId, floorNumber",
  units: "++id, floorId, modelId, unitNumber",
  tours: "++id, projectId, modelId",
  scenes: "++id, tourId",

  // Media storage
  images: "++id, filename, uploadedAt",

  // Autosave snapshots
  autosave: "key, timestamp",
});
```

### Autosave Mechanism

```typescript
// Autosave hook
const useAutosave = <T>(key: string, data: T, debounceMs: number = 30000) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useDebouncedEffect(
    () => {
      const save = async () => {
        setIsSaving(true);
        try {
          await db.autosave.put({
            key,
            data: JSON.stringify(data),
            timestamp: Date.now(),
          });
          setLastSaved(new Date());
        } catch (error) {
          console.error("Autosave failed:", error);
        } finally {
          setIsSaving(false);
        }
      };

      save();
    },
    [data],
    debounceMs
  );

  return { lastSaved, isSaving };
};
```

---

## Data Flow & Relationships Diagram

```text
Project
├── Models (many)
│   ├── Thumbnail Image
│   ├── 360° Rotation Images (optional)
│   └── Virtual Tour (optional, references Tour)
├── Map (one)
│   ├── Background Image
│   ├── Landmarks (many)
│   │   ├── POI (CircleGeometry)
│   │   └── Complex (PolygonGeometry)
│   └── Paths (many, connect Complex to POIs)
├── Master Plan (one)
│   ├── Buildings (many, created here)
│   └── Angles (many)
│       ├── Background Image
│       ├── BuildingHotspots (many, reference Buildings)
│       └── Transition Images (optional)
└── Buildings (many, from Master Plan)
    ├── Exterior Image (optional)
    └── Floors (many, created here)
        ├── Floor Plan Image (optional)
        └── Units (many, reference Models)

Tours (many)
├── Reference Model
└── Scenes (many)
    ├── Panorama Image
    └── Hotspots (many, reference other Scenes)
```

---

## Export Format

### JSON Structure (matches viewer schema)

```text
exported-project.zip
├── config/
│   ├── project.json          → ProjectConfig
│   ├── models.json           → Model[]
│   ├── landmarks.json        → Landmark[] + LandmarkPath[]
│   ├── masterplan/
│   │   └── buildings.json    → MasterPlanConfig
│   ├── buildings/
│   │   ├── b11/
│   │   │   ├── building.json → BuildingConfig
│   │   │   └── floors/
│   │   │       ├── floor-0.json → FloorConfig
│   │   │       └── floor-1.json → FloorConfig
│   └── tours/
│       ├── model-A-1/
│       │   └── tour.json     → TourConfig
├── images/
│   ├── models/
│   ├── map/
│   ├── masterplan/
│   ├── buildings/
│   └── floors/
└── README.md
```

---

## Validation & Integrity Rules

### Cross-Entity Validation

1. **Model References**:

   - Units must reference existing Models
   - Deletion of Model triggers warning with affected Units list

2. **Building References**:

   - Buildings created in Master Plan must exist in Buildings Store
   - BuildingHotspots must reference existing Buildings
   - Deletion of Building cascades to Floors and Units (with confirmation)

3. **Floor References**:

   - Floors created in Building must exist in Floors Store
   - Floor hotspots on building exterior must exist
   - Deletion of Floor cascades to Units (with confirmation)

4. **Image References**:

   - All ImageRef entities must have corresponding blob in IndexedDB
   - Orphaned images cleaned up on export

5. **Tour References**:
   - Tours must reference existing Models
   - Scene hotspots must reference existing Scenes in same Tour
   - Tour graph must be fully connected

### Geometric Validation

1. **Polygon Geometry**:

   - Minimum 3 vertices
   - Vertices must be within parent image bounds
   - Self-intersection warning (not error)

2. **Circle Geometry**:

   - Radius must be > 0
   - Center must be within parent image bounds

3. **Coordinates**:
   - All x/y values must be >= 0
   - All x values must be <= image width
   - All y values must be <= image height

---

**Next Phase**: Proceed to Phase 1 Contracts (JSON Schemas)
