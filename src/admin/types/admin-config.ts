/**
 * Admin Configuration Types
 * Core data types for the admin dashboard configuration system
 */

// ============================================================================
// Common Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface ImageRef {
  id: string; // UUID
  filename: string; // Original filename
  blob?: Blob; // Image data (in IndexedDB)
  url?: string; // Object URL or external URL
  width: number; // Image dimensions
  height: number;
  size: number; // File size in bytes
  mimeType: "image/jpeg" | "image/png";
  uploadedAt: string; // ISO 8601
}

// ============================================================================
// Geometry Types
// ============================================================================

export interface CircleGeometry {
  type: "circle";
  center: Point;
  radius: number; // In pixels
}

export interface PolygonGeometry {
  type: "polygon";
  vertices: Point[]; // Array of { x, y } coordinates
  closed: true; // Always closed for landmarks
}

export type Geometry = CircleGeometry | PolygonGeometry;

// ============================================================================
// Project Configuration
// ============================================================================

export interface ProjectConfig {
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

// ============================================================================
// Model (Apartment Type)
// ============================================================================

export interface Rotation360Config {
  folder: string; // Path to frame images folder (e.g., "/data/models/model-A-1")
  frameCount: number; // Number of rotation frames
  filenamePattern?: string; // Optional pattern (e.g., "model-A-1_{index}.jpg")
  frames?: ImageRef[]; // Array of frame image references (for admin only)
}

export interface Model {
  id: string; // Unique identifier (e.g., "A-1", "B-2")
  projectId: string; // Foreign key to Project
  title: string; // Display name (e.g., "Modern 3-Bedroom Apartment")
  description: string; // Rich text description
  areaM2: number; // Floor area in square meters
  bedrooms: number; // Number of bedrooms
  bathrooms: number; // Number of bathrooms
  tourPath: string | null; // Path to virtual tour JSON
  imagePath: string; // Path to model thumbnail (e.g., "/data/models/model-A-1.jpg")
  rotation360?: Rotation360Config; // Optional 360° rotation
  // Admin-only fields (not exported)
  thumbnail?: ImageRef; // Thumbnail image reference (for admin editing)
  displayOrder: number; // Sort order in lists
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Map Configuration
// ============================================================================

export interface Landmark {
  id: string;
  projectId: string;
  type: "poi" | "complex"; // Point of Interest or Main Complex
  name: string;
  description?: string;
  geometry: CircleGeometry | PolygonGeometry;
  metadata?: {
    distanceK?: number; // Distance from complex in kilometers
    timeMin?: number; // Travel time in minutes
    category?: string; // e.g., "transport", "shopping", "education"
  };
  createdAt: string;
  updatedAt: string;
}

export interface LandmarkPath {
  id: string;
  projectId: string;
  fromLandmarkId: string; // Must be 'complex' type
  toLandmarkId: string; // Must be 'poi' type
  pathData: string; // SVG path d attribute
  style?: {
    stroke?: string; // Default: "#000000"
    strokeWidth?: number; // Default: 2
    strokeDasharray?: string; // e.g., "5,5" for dashed
  };
  createdAt: string;
  updatedAt: string;
}

export interface MapConfig {
  id: string;
  projectId: string;
  backgroundImage: ImageRef; // Site map image
  viewport: {
    width: number; // Image native width
    height: number; // Image native height
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Master Plan Configuration
// ============================================================================

export interface BuildingReference {
  id: string; // Building UUID
  name: string; // Building name/number
  displayName?: string; // Optional display override
  totalFloors?: number; // Total number of floors in building
  availableUnits?: number; // Number of available units
}

export interface BuildingHotspot {
  id: string;
  buildingId: string; // References Building entity
  geometry: PolygonGeometry; // Clickable area on this angle
  label?: string; // Optional label overlay
}

export interface TransitionSequence {
  folder: string; // Path to transition frames
  frameCount: number; // Number of frames
  filenamePattern: string; // e.g., "frame-{index}.jpg"
  frames: ImageRef[]; // Transition frame images (required for admin editing)
}

// ============================================================================
// Street View / Tour Configuration
// ============================================================================

export interface TourPointPosition {
  angleId: string; // Which angle this position is for
  position: Point; // x, y coordinates on that angle's image
}

export interface TourPoint {
  id: string; // Unique identifier (e.g., "entrance", "plaza")
  name: string; // Display name for this tour point (e.g., "Main Entrance")
  positions: TourPointPosition[]; // Position on each angle
  panoramicImage?: ImageRef; // 360° panoramic image for this point
  initialView?: {
    yaw: number; // Horizontal rotation (degrees)
    pitch: number; // Vertical rotation (degrees)
    fov: number; // Field of view
  };
  projectId: string; // Link to project
  createdAt: string;
  updatedAt: string;
}

export interface AngleView {
  id: string; // e.g., "angle-1", "angle-2"
  masterPlanId: string;
  projectId: string;
  backgroundImage: ImageRef;
  sequenceIndex: number; // Order in rotation
  hotspots: BuildingHotspot[]; // Hotspots for buildings on this angle
  tourPointIds: string[]; // IDs of tour points visible on this angle
  transitionToNext?: TransitionSequence;
  createdAt: string;
  updatedAt: string;
}

export interface MasterPlanConfig {
  id: string;
  projectId: string;
  backgroundImage: ImageRef; // Main master plan image
  buildings: BuildingReference[]; // Building entities created here
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Building Configuration
// ============================================================================

export interface FloorReference {
  id: string; // Floor UUID
  name: string; // e.g., "Ground Floor", "Floor 1"
  floorNumber: number; // Numeric level (0 = ground)
  hotspot?: PolygonGeometry; // Hotspot on building exterior image
}

export interface BuildingConfig {
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

// ============================================================================
// Floor Configuration
// ============================================================================

export interface UnitHotspot {
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

export interface FloorConfig {
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

// ============================================================================
// Virtual Tour Configuration
// ============================================================================

export interface SceneHotspot {
  id: string;
  targetSceneId: string; // Foreign key to TourScene
  position: {
    yaw: number; // Horizontal angle (-180 to 180)
    pitch: number; // Vertical angle (-90 to 90)
  };
  tooltip?: string;
  icon?: "arrow" | "door" | "info" | "custom";
  customIcon?: string; // SVG or image URL for custom icon
  targetYaw?: number; // Camera yaw when arriving at target scene
  targetPitch?: number; // Camera pitch when arriving at target scene
}

export interface TourScene {
  id: string;
  name: string;
  panoramaImage: ImageRef; // Equirectangular 360° image
  hotspots: SceneHotspot[];
  defaultYaw?: number; // Default horizontal camera angle
  defaultPitch?: number; // Default vertical camera angle
  defaultZoom?: number; // Default zoom level (0-100)
  metadata?: {
    captureDate?: string;
    photographer?: string;
    viewpoint?: string; // e.g., "Living Room", "Master Bedroom"
  };
}

export interface TourConfig {
  id: string;
  projectId: string;
  modelId: string; // Foreign key to Model
  name: string;
  startingSceneId: string; // Initial scene to display
  scenes: TourScene[];
  createdAt: string;
  updatedAt: string;
}
