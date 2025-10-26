# Model Schema Update & Image Export

## Changes Made

### 1. Model Type Schema Update

Updated `Model` type in `src/admin/types/admin-config.ts` to match the viewer's JSON structure:

**Before** (nested structure):

```typescript
{
  specs: { areaM2, bedrooms, bathrooms },
  media: { thumbnail, rotation360 },
  pricing: { startingPrice, currency },
  availability: "available" | "sold-out" | "coming-soon"
}
```

**After** (flat structure):

```typescript
{
  areaM2: number,
  bedrooms: number,
  bathrooms: number,
  tourPath: string | null,
  imagePath: string,  // "/data/models/model-A-1.jpg"
  rotation360?: {
    folder: string,           // "/data/models/model-A-1"
    frameCount: number,
    filenamePattern?: string  // "model-A-1_{index}.jpg"
  },
  thumbnail?: ImageRef  // Admin-only field
}
```

**Key Changes:**

- ✅ Removed `pricing` and `availability` (moved to units)
- ✅ Flattened specs to top level (areaM2, bedrooms, bathrooms)
- ✅ Added `tourPath` and `imagePath` fields
- ✅ Changed `rotation360.frames` to optional (for admin editing only)
- ✅ Kept `thumbnail` as admin-only field for editing

### 2. ModelEditor Component

**Removed:**

- Pricing section (Starting Price, Currency dropdown)
- Availability dropdown (Available/Sold Out/Coming Soon)

**Updated:**

- Form data interface simplified
- Save logic updated to use flat schema
- Image path auto-generated as `/data/models/model-{id}.jpg`

### 3. ModelsPage Component

**Updated Display:**

- Removed pricing display from model cards
- Changed `model.media.thumbnail` → `model.thumbnail`
- Changed `model.media.rotation360` → `model.rotation360`
- Changed `model.specs.areaM2` → `model.areaM2`

### 4. File Export System

Created new `fileExporter.ts` service that exports:

**Export Structure:**

```text
models-export.zip/
├── models.json                    # Array of models matching viewer schema
├── models/
│   ├── model-A-1.jpg             # Thumbnail images
│   ├── model-B-2.jpg
│   ├── model-C-1.jpg
│   ├── model-A-1/                # 360° rotation folders
│   │   ├── model-A-1_0.jpg
│   │   ├── model-A-1_1.jpg
│   │   ├── ...
│   │   └── model-A-1_59.jpg
│   ├── model-B-2/
│   │   ├── model-B-2_0.jpg
│   │   ├── ...
│   └── model-C-1/
│       ├── model-C-1_0.jpg
│       ├── ...
```

**Functions:**

- `exportModelsWithImages(projectId)` - Exports models with all images
- `exportCompleteProject(projectId)` - Exports project + models + images
- Uses JSZip to create ZIP archive
- Uses FileSaver.js to trigger browser download

### 5. Export Menu Updates

**Export Options:**

1. **Models with Images** → `models-export.zip`
   - Contains: models.json + all thumbnails + 360° frames
2. **Complete Project** → `{slug}-complete-export.zip`
   - Contains: data/project.json + data/models.json + all images

### 6. Database & Store Updates

**modelsStore.ts:**

- Updated `add360Rotation` to use `rotation360` field directly
- Updated `update360Frame` to work with flat schema
- Simplified state updates

## Installation

```bash
npm install jszip file-saver
npm install --save-dev @types/jszip @types/file-saver
```

## Testing

1. Navigate to `/admin/models`
2. Create a model with:
   - Title, description, specs (area, bedrooms, bathrooms)
   - Thumbnail image
   - 360° rotation (12+ frames)
3. Click "Export" dropdown
4. Select "Models with Images"
5. Verify ZIP structure matches:

   ```text
   models-export.zip/
   ├── models.json
   └── models/
       ├── model-{id}.jpg
       └── model-{id}/
           ├── model-{id}_0.jpg
           ├── model-{id}_1.jpg
           └── ...
   ```

6. Verify `models.json` structure:

   ```json
   [
     {
       "id": "A-1",
       "title": "Modern 3-Bedroom Apartment",
       "description": "...",
       "areaM2": 118,
       "bedrooms": 3,
       "bathrooms": 2,
       "tourPath": null,
       "imagePath": "/data/models/model-A-1.jpg",
       "rotation360": {
         "folder": "/data/models/model-A-1",
         "frameCount": 60,
         "filenamePattern": "model-A-1_{index}.jpg"
       }
     }
   ]
   ```

## Migration Notes

### For Existing Data

If you have existing models in the database, they may still have the old schema with nested `specs`, `media`, `pricing`, and `availability` fields. The export service handles this gracefully:

- Reads from both old (`model.specs.areaM2`) and new (`model.areaM2`) schemas
- Falls back to 0 if fields are missing
- Exports in new flat schema format

### Breaking Changes

1. **Pricing & Availability** removed from Model

   - These should now be stored in `Unit` entities
   - Each unit can have its own pricing and availability status

2. **Media Structure** flattened

   - Old: `model.media.thumbnail.url`
   - New: `model.thumbnail.url` (admin) or `model.imagePath` (export)

3. **Specs Structure** flattened
   - Old: `model.specs.areaM2`
   - New: `model.areaM2`

## File Structure

```text
src/admin/
├── types/
│   └── admin-config.ts           # Updated Model type
├── components/
│   ├── editors/
│   │   ├── ModelEditor.tsx       # Removed pricing/availability
│   │   └── Model360RotationUploader.tsx
│   └── export/
│       ├── ExportMenu.tsx        # Updated to use fileExporter
│       └── ExportButton.tsx
├── services/
│   └── export/
│       ├── fileExporter.ts       # NEW: Image export with ZIP
│       └── jsonExporter.ts       # Legacy JSON-only export
├── stores/
│   └── modelsStore.ts            # Updated for flat schema
└── pages/
    └── ModelsPage.tsx            # Removed pricing display
```

## TypeScript Compilation

✅ All files compile with 0 errors:

```bash
npx tsc --noEmit
# No errors found
```

## Next Steps

1. Test export functionality with real data
2. Extract ZIP and verify image files are valid
3. Test exported models.json in viewer application
4. Update Unit schema to include pricing and availability
5. Create UnitsPage for managing unit-specific data

---

**Status**: ✅ Complete  
**Date**: 2025-10-24  
**Files Changed**: 8 files updated + 1 new file created
