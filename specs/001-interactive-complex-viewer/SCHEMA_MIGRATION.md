# Schema Refactoring: Model-Unit Separation

## Overview

This is a major architectural change that separates unit specifications (model blueprints) from unit instances (specific units with availability/pricing).

## Changes Made

### 1. New Schema: `model.schema.json`

**Purpose**: Defines unit model/blueprint specifications

```json
{
  "id": "A-1",
  "areaM2": 118,
  "bedrooms": 3,
  "bathrooms": 2,
  "tourPath": "/data/tours/model-a1/tour.json"
}
```

### 2. Updated Schema: `unit.schema.json`

**Purpose**: Specific unit instance with location and status

```json
{
  "id": "unit-b12-32",
  "modelId": "A-1",
  "buildingId": "b11",
  "floorId": "f3",
  "availability": "Available",
  "price": 540000
}
```

### 3. Updated Schema: `floor.schema.json`

**Purpose**: Floor plan with simplified hotspots

- Added: `buildingId` (required)
- Changed: `UnitHotspot` now only contains `unitId` and `shape`
- Removed: Embedded tooltip data (now derived at runtime)

```json
{
  "id": "f3",
  "buildingId": "b11",
  "units": [
    {
      "unitId": "unit-b12-32",
      "shape": [620, 410, 688, 388, 712, 452]
    }
  ]
}
```

## Data Files Updated

1. **`/public/data/models.json`** (NEW)

   - Contains all unit model specifications
   - One record per model type (A-1, B-2, etc.)

2. **`/public/data/units.json`** (UPDATED)

   - Now references `modelId` instead of containing specs
   - Added `buildingId` and `floorId` for location

3. **`/public/data/buildings/b11/floors/f3.json`** (UPDATED)
   - Added `buildingId` field
   - Simplified `units` array to only contain `unitId` + `shape`
   - Removed embedded tooltip data

## TypeScript Changes

### Types (`src/data/types.ts`)

- **Added**: `Model` type
- **Updated**: `Floor` type (added `buildingId`, simplified `UnitHotspot`)
- **Updated**: `Unit` type (removed specs, added location refs)
- **Updated**: `UnitHotspot` type (simplified to `unitId` + `shape`)

### Loaders (`src/data/loaders.ts`)

- **Added**: `loadModels()` function

### Schema Registry (`src/data/schemas/index.ts`)

- **Added**: `"model"` to `SchemaKey` union type
- **Added**: Model schema loader

### New Utility (`src/data/enrichment.ts`)

- `enrichFloorData()` - Joins floor, unit, and model data at runtime
- `getUnitTourPath()` - Gets tour path from model
- `deriveTourId()` - Extracts tour ID from path

## Benefits

1. **Data Normalization**: Model specifications defined once, referenced many times
2. **Flexibility**: Easy to add new units of same model type
3. **Maintainability**: Update model specs (tour path, dimensions) in one place
4. **Separation of Concerns**:
   - Models = What it is (blueprint)
   - Units = Where it is + Who owns it (instance)
   - Floors = How to display it (visualization)

## Migration Steps for Views

### FloorPlanView Component

```typescript
// OLD:
import { loadFloor, loadUnits } from "../data/loaders";
const floor = await loadFloor(buildingId, floorId);
const unit = floor.units.find((u) => u.id === selectedId);
const tourPath = unitRecord.tourPath;

// NEW:
import { loadFloor, loadUnits, loadModels } from "../data/loaders";
import { enrichFloorData, getUnitTourPath } from "../data/enrichment";

const [floor, units, models] = await Promise.all([
  loadFloor(buildingId, floorId),
  loadUnits(),
  loadModels(),
]);

const enrichedFloor = enrichFloorData(floor, units, models);
const hotspot = enrichedFloor.units.find((u) => u.unitId === selectedId);
const unit = units.find((u) => u.id === selectedId);
const tourPath = unit ? getUnitTourPath(unit, models) : null;
```

### Key Changes in Components

1. Load three data sources: floor, units, models
2. Use `enrichFloorData()` to join the data
3. Work with `EnrichedUnitHotspot` which has the tooltip data
4. Use `getUnitTourPath()` to get tour path from model
5. Update references from `unit.id` to `hotspot.unitId`

## Validation

All schemas have been updated with:

- Proper descriptions
- Required field annotations
- Type constraints
- Validation in dev mode via schema loaders

## Next Steps

1. Update `FloorPlanView.tsx` to use enrichment functions
2. Update `BuildingView.tsx` if it references floor/unit data
3. Test with dev server to ensure validation passes
4. Verify tour navigation still works correctly
