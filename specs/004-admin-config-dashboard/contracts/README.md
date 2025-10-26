# Admin Configuration Contracts

**Feature**: Admin Configuration Dashboard  
**Purpose**: JSON Schema definitions for admin configuration data model

## Overview

This directory contains JSON Schema definitions for validating the admin dashboard configuration data. These schemas ensure data integrity and provide clear contracts between the admin interface and the storage/export layers.

## Schema Files

### Core Configuration Schemas

1. **admin-project-config.schema.json**

   - Top-level project settings and metadata
   - Developer information and branding
   - Project metadata (location, completion date, etc.)

2. **admin-model-config.schema.json**

   - Apartment model/floor plan definitions
   - Specifications (area, bedrooms, bathrooms)
   - Media assets (thumbnail, 360° rotations)
   - Shared definitions: `ImageRef`, `Rotation360Config`

3. **admin-map-config.schema.json**

   - Site map configuration
   - Landmark definitions (POI circles and Main Complex polygon)
   - SVG path connections between complex and POIs
   - Shared definitions: `CircleGeometry`, `PolygonGeometry`, `Point`, `Landmark`, `LandmarkPath`

4. **admin-masterplan-config.schema.json** _(to be created)_

   - Master plan viewing angles
   - Building entities and hotspots
   - Transition sequences between angles

5. **admin-building-config.schema.json** _(to be created)_

   - Building exterior configuration
   - Floor references and hotspots

6. **admin-floor-config.schema.json** _(to be created)_

   - Floor plan configuration
   - Unit hotspots and model references

7. **admin-tour-config.schema.json** _(to be created)_
   - 360° virtual tour configuration
   - Scene definitions and hotspot navigation

## Shared Definitions

Several types are reused across schemas:

### ImageRef

Represents an uploaded image with metadata:

```json
{
  "id": "uuid",
  "filename": "original-name.jpg",
  "url": "blob:... or external URL",
  "width": 1920,
  "height": 1080,
  "size": 524288,
  "mimeType": "image/jpeg",
  "uploadedAt": "2025-10-24T12:00:00Z"
}
```

**Constraints**:

- Maximum size: 10MB (10,485,760 bytes)
- Allowed MIME types: `image/jpeg`, `image/png`
- Dimensions: minimum 1×1 pixels

### Geometry Types

**CircleGeometry** (used for POI landmarks):

```json
{
  "type": "circle",
  "center": { "x": 100, "y": 200 },
  "radius": 25
}
```

**PolygonGeometry** (used for complex landmarks, building hotspots, unit boundaries):

```json
{
  "type": "polygon",
  "vertices": [
    { "x": 100, "y": 100 },
    { "x": 200, "y": 100 },
    { "x": 200, "y": 200 }
  ],
  "closed": true
}
```

**Constraints**:

- Polygons: minimum 3 vertices
- All coordinates must be ≥ 0
- Coordinates should be within parent image dimensions (validated at runtime)

## Validation Strategy

### Client-Side Validation

1. **Real-time validation**: As user edits properties
2. **Pre-save validation**: Before persisting to IndexedDB
3. **Export validation**: Before generating ZIP download

### Validation Levels

**Error** (blocks save/export):

- Missing required fields
- Invalid data types
- Constraint violations (min/max)
- Referential integrity errors (e.g., unit references non-existent model)

**Warning** (allows save with notification):

- Incomplete hotspot coverage (building missing hotspots on some angles)
- Overlapping unit boundaries
- Missing optional fields that enhance UX

## Usage Examples

### TypeScript Integration

```typescript
import Ajv from "ajv";
import projectSchema from "./contracts/admin-project-config.schema.json";

const ajv = new Ajv();
const validateProject = ajv.compile(projectSchema);

const project: ProjectConfig = {
  id: "...",
  name: "Aurora Complex",
  // ...
};

if (!validateProject(project)) {
  console.error("Validation errors:", validateProject.errors);
}
```

### Export Validation

```typescript
import { validateExport } from "@/admin/services/validation/schemaValidator";

const exportProject = async (config: FullConfig) => {
  const errors = await validateExport(config);

  if (errors.length > 0) {
    // Display errors to user
    showValidationErrors(errors);
    return;
  }

  // Proceed with export
  const zip = await generateZip(config);
  saveAs(zip, `${config.project.name}.zip`);
};
```

## Referential Integrity Rules

These cross-schema validations are enforced at the application level:

1. **Model → Unit**: Units must reference existing models
2. **Building → Floor**: Floors must belong to existing buildings
3. **MasterPlan → Building**: Building hotspots must reference buildings created in master plan
4. **Tour → Scene**: Scene hotspots must reference other scenes in same tour
5. **Map → Path**: Paths must connect the complex landmark to POI landmarks

## Schema Versioning

Schemas follow the project version. When breaking changes are made:

1. Increment schema version in `$id`
2. Update migration scripts in `/admin/services/migrations/`
3. Document breaking changes in CHANGELOG.md

## Related Documentation

- [Data Model](../data-model.md) - Complete entity definitions and relationships
- [Research](../research.md) - Technology decisions and validation strategies
- [Spec](../spec.md) - Feature requirements and user scenarios

## Notes

- These schemas are for **admin dashboard internal use** only
- Export schemas (viewer-compatible) are defined in `specs/001-interactive-complex-viewer/contracts/`
- The admin may store additional metadata not present in viewer schemas
- Export process transforms admin format to viewer format

---

**Status**: Schema definitions in progress (3/7 complete)  
**Next**: Complete remaining schemas for masterplan, building, floor, and tour configurations
