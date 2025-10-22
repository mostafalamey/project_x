# Data Model: Real Estate Complex Interactive Viewer

Date: 2025-10-22

## Entities

### Map

- image: string (path to map image)
- landmarks: Landmark[]

### Landmark

- id: string
- name: string
- coords: { x: number, y: number } | polygon: number[]
- type: "complex" | "poi"

### MasterPlan

- angles: string[] (paths to isometric images)
- buildings: BuildingOverlay[]

### BuildingOverlay

- id: string (buildingId)
- name: string
- polygon: number[] (coords for clickable area)
- summary: { totalFloors: number; availableUnits: number }

### Building

- id: string
- name: string
- totalFloors: number
- elevationImage: string
- floors: Floor[]

### Floor

- id: string
- number: number
- planImage: string
- units: UnitHotspot[]

### Unit

- id: string
- areaM2: number
- bedrooms: number
- bathrooms: number
- availability: "Available" | "Reserved" | "Sold"
- price?: number
- tourPath: string (path to tour.json for this unit)

### UnitHotspot

- id: string (unitId)
- shape: number[] (polygon coords)
- tooltip: { id: string; areaM2: number; bedrooms: number; bathrooms: number; availability: string; price?: number }

### PanoScene

- id: string
- image: string
- links: { target: string; x: number; y: number }[]
- initialView?: { yaw?: number; pitch?: number; fov?: number }

### Tour

- startSceneId?: string (default scene id)
- scenes: PanoScene[]

## Relationships

- Map.landmarks → Landmark\*
- MasterPlan.buildings → BuildingOverlay\* referencing Building
- Building.floors → Floor\*
- Floor.units → UnitHotspot\* referencing Unit
- Unit.tourPath → Tour (external JSON file)

## Validation Rules

- Unit.availability ∈ {Available, Reserved, Sold}
- All image paths must be relative to `/public` for static hosting
- Polygons must have ≥ 3 points (≥ 6 numbers)
- PanoScene.links.target must reference an existing scene id
