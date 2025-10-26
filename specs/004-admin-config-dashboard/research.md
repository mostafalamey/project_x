# Research & Technology Decisions: Admin Configuration Dashboard

**Date**: 2025-10-24  
**Feature**: Admin Configuration Dashboard  
**Phase**: 0 - Research & Architecture Decisions

## Overview

This document captures research findings and architectural decisions for implementing the Admin Configuration Dashboard. Each decision addresses specific unknowns from the Technical Context or requirements from the feature specification.

---

## 1. Canvas Drawing Library Selection

### Decision

**Chosen**: Konva.js 9.x with React-Konva 18.x

### Rationale — Canvas

1. **Interactive Polygon Drawing**: Konva provides native support for:

   - Click-to-create polygon drawing
   - Vertex dragging for polygon editing
   - Shape transformations and manipulations
   - Event handling for mouse/touch interactions

2. **Performance**: Konva uses HTML5 Canvas API with efficient rendering:

   - Handles 50+ polygons with 20 vertices each without lag
   - Layer-based rendering for optimized redraws
   - Meets <500ms performance requirement for drawing operations

3. **React Integration**: React-Konva provides declarative API:

   - Component-based shape definitions
   - Automatic reconciliation with React state
   - Hooks for canvas lifecycle management

4. **Ecosystem**: Mature library with:
   - 20K+ GitHub stars
   - Active maintenance (last update within 3 months)
   - Comprehensive documentation
   - TypeScript support

### Alternatives Considered — Canvas

**Fabric.js**:

- ❌ Rejected: Larger bundle size (~180KB vs 80KB)
- ❌ More complex API for simple polygon operations
- ✅ Better for image manipulation (not primary use case)

**SVG with D3.js**:

- ❌ Rejected: Performance degrades with many polygons
- ❌ DOM-heavy approach causes layout thrashing
- ✅ Better accessibility (native SVG elements)
- **Note**: Accessibility concerns addressed via ARIA enhancements in action items

**Plain Canvas API**:

- ❌ Rejected: Requires building polygon editor from scratch
- ❌ No built-in hit detection or event management
- ✅ Smallest bundle size (0KB)
- **Note**: Development time cost outweighs bundle savings

### Canvas Implementation Strategy

```typescript
// Polygon drawing with Konva
<Layer>
  <Line
    points={polygonPoints}
    closed
    stroke="blue"
    fill="rgba(0,0,255,0.2)"
    draggable
    onClick={handlePolygonClick}
  />
  {vertices.map((vertex, i) => (
    <Circle
      key={i}
      x={vertex.x}
      y={vertex.y}
      radius={5}
      draggable
      onDragMove={(e) => handleVertexDrag(i, e)}
    />
  ))}
</Layer>
```

---

## 2. State Management Architecture

### Decision: Global State Management

**Chosen**: Zustand 4.x for global state management

### Rationale — State Management

1. **Minimal Boilerplate**: Zustand requires ~10 lines vs Redux ~50 lines per store
2. **Performance**: Selective subscription prevents unnecessary re-renders
3. **Bundle Size**: 1.2KB gzipped vs Redux 11KB + React-Redux 6KB
4. **TypeScript Support**: First-class TS support with inferred types
5. **Devtools**: Redux DevTools integration available via middleware

### Alternatives Considered — State Management

**React Context API**:

- ❌ Rejected for global state: Performance issues with frequent updates
- ✅ Still used for theme/localization (rarely changing data)
- ❌ No devtools integration
- ❌ Requires custom solution for persistence

**Redux Toolkit**:

- ❌ Rejected: Overkill for this application's state complexity
- ✅ Better for very large applications (100+ actions)
- ❌ Larger bundle size (17KB total)
- ❌ More learning curve for team

**Jotai/Recoil**:

- ❌ Rejected: Atom-based approach adds complexity
- ✅ Good for derived state (not primary use case)
- ❌ Smaller ecosystem/community

### Store Architecture

```typescript
// Project configuration store
interface ProjectStore {
  config: ProjectConfig;
  isDirty: boolean;
  updateConfig: (updates: Partial<ProjectConfig>) => void;
  resetConfig: () => void;
}

// Separate stores for bounded contexts
const useProjectStore = create<ProjectStore>();
const useModelsStore = create<ModelsStore>();
const useMapStore = create<MapStore>();
const useMasterPlanStore = create<MasterPlanStore>();
const useBuildingsStore = create<BuildingsStore>();
const useFloorsStore = create<FloorsStore>();
const useCanvasStore = create<CanvasStore>(); // UI state only
```

**Benefits**:

- Domain separation (models, map, buildings isolated)
- Easier to test individual stores
- Clear data flow and dependencies
- Canvas UI state separate from business data

---

## 3. Persistence Strategy

### Decision: Data Persistence

**Chosen**: Dexie.js 4.x (IndexedDB wrapper) for autosave + LocalStorage for preferences

### Rationale — Persistence

1. **Storage Capacity**:

   - IndexedDB: ~50MB to 1GB+ (browser dependent)
   - LocalStorage: 5-10MB limit (insufficient for images)
   - Meets requirement for 2-5MB project configurations

2. **Dexie.js Benefits**:

   - Promise-based API (vs callback-based IndexedDB)
   - ACID transactions for consistency
   - Query capabilities (find, filter, sort)
   - Schema versioning for migrations
   - TypeScript support

3. **Autosave Implementation**:
   - Debounced saves (30 seconds after last edit)
   - Differential updates (only changed entities)
   - Optimistic UI with background persistence

### Alternatives Considered — Persistence

**LocalStorage Only**:

- ❌ Rejected: 5-10MB limit too small
- ❌ Synchronous API blocks main thread
- ✅ Simpler API
- ✅ Used for user preferences (theme, last section visited)

**Raw IndexedDB**:

- ❌ Rejected: Complex callback-based API
- ❌ Manual schema management
- ✅ No library dependency (0KB)
- **Note**: Dexie's 15KB is worth the DX improvement

**File System Access API**:

- ❌ Rejected: Limited browser support (Chrome only)
- ❌ Requires user permission for each access
- ✅ Direct file system access
- **Note**: Export feature provides similar functionality

### Implementation Strategy — Persistence (Dexie)

```typescript
// Dexie database schema
export const db = new Dexie("AdminConfigDB");

db.version(1).stores({
  projects: "++id, name, updatedAt",
  models: "++id, projectId, modelId",
  landmarks: "++id, projectId, landmarkId",
  buildings: "++id, projectId, buildingId",
  floors: "++id, buildingId, floorId",
  autosave: "key, timestamp",
});

// Autosave hook
const useAutosave = (storeName: string, data: any) => {
  useDebouncedEffect(
    () => {
      db.autosave.put({
        key: storeName,
        data: data,
        timestamp: Date.now(),
      });
    },
    [data],
    30000
  ); // 30 second debounce
};
```

---

## 4. Image Upload & Validation

### Decision: File Upload Solution

**Chosen**: React Dropzone 14.x + Client-side validation

### Rationale — Image Upload

1. **React Dropzone Features**:

   - Drag-and-drop + click-to-upload
   - File type validation (accept prop)
   - File size validation (maxSize prop)
   - Multiple file upload support
   - Preview generation
   - Accessible (keyboard navigation)

2. **Validation Strategy**:

   - File type: JPEG/PNG only (via MIME type check)
   - File size: Max 10MB per image
   - Image dimensions: Validation after load
   - Rotation sequence: Consistent dimensions check

3. **Performance**:
   - FileReader API for preview (async, non-blocking)
   - Image compression using Canvas API before storage
   - Lazy loading for uploaded images in lists

### Alternatives Considered — Image Upload

**Native Input File**:

- ❌ Rejected: No drag-and-drop UI
- ❌ Poor UX for multiple uploads
- ✅ Smallest implementation (0KB)

**Uppy**:

- ❌ Rejected: Overkill (50KB+, includes upload endpoints)
- ✅ Better for cloud uploads (not needed)
- ❌ Designed for server uploads (static-only constraint)

### Implementation Strategy — Image Upload

```typescript
const ImageDropzone = ({
  onUpload,
  accept = "image/jpeg,image/png",
  maxSize = 10485760,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    onDrop: async (acceptedFiles) => {
      // Validate image dimensions
      for (const file of acceptedFiles) {
        const img = await loadImage(file);
        if (img.width > 5000 || img.height > 5000) {
          showError("Image dimensions too large");
          continue;
        }
        onUpload(file, img);
      }
    },
  });

  return <div {...getRootProps()}>...</div>;
};
```

---

## 5. Export/Import Format & ZIP Generation

### Decision: Export Format

**Chosen**: JSZip 3.x for ZIP generation + FileSaver.js 2.x for downloads

### Rationale — Export

1. **JSZip Features**:

   - Client-side ZIP file creation
   - Add files from Blob/ArrayBuffer/Base64
   - Folder structure support
   - Async compression (doesn't block UI)
   - TypeScript support

2. **FileSaver.js**:

   - Cross-browser download support
   - Handles large files (>100MB)
   - No flash/server required
   - 1.5KB gzipped

3. **Export Structure**:

   ```text
   project-export.zip
   ├── config/
   │   ├── project.json
   │   ├── models.json
   │   ├── landmarks.json
   │   ├── masterplan/
   │   │   └── buildings.json
   │   └── buildings/
   │       ├── b11/
   │       │   └── floors/
   │       │       └── floor-1.json
   ├── images/
   │   ├── models/
   │   ├── map/
   │   ├── masterplan/
   │   ├── buildings/
   │   └── floors/
   └── README.md (deployment instructions)
   ```

### Alternatives Considered — Export/Import

**Direct JSON Download (no ZIP)**:

- ❌ Rejected: Images must be downloaded separately
- ❌ Poor UX (multiple downloads)
- ✅ Simpler implementation

**Base64 Embed Images in JSON**:

- ❌ Rejected: Massive file sizes (33% larger)
- ❌ Difficult to edit/review
- ❌ Exceeds browser download limits

### Implementation Strategy — Export Format & ZIP Generation

```typescript
const exportProject = async (config: ProjectConfig) => {
  const zip = new JSZip();

  // Add JSON files
  zip.file("config/project.json", JSON.stringify(config.project, null, 2));
  zip.file("config/models.json", JSON.stringify(config.models, null, 2));

  // Add images from IndexedDB
  const images = await db.images.toArray();
  for (const img of images) {
    zip.file(`images/${img.path}`, img.blob);
  }

  // Generate and download
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  saveAs(blob, `${config.project.name}-export.zip`);
};
```

---

## 6. 360° Tour Editor Integration

### Decision: Panorama Viewer

**Chosen**: React Photo Sphere Viewer 2.0+ with custom hotspot UI

### Rationale — 360° Tour

1. **Library Features**:

   - Equirectangular panorama support
   - Touch/mouse controls (pan, zoom)
   - Hotspot markers with custom HTML
   - Event system (click, load, ready)
   - TypeScript definitions

2. **Hotspot Editing Approach**:

   - Click panorama → Get yaw/pitch coordinates
   - Render custom marker component
   - Edit hotspot properties in overlay panel
   - Link to target scene via dropdown

3. **Performance**:
   - WebGL-accelerated rendering
   - Handles 4K panoramas smoothly
   - Lazy loads scene images

### Alternatives Considered

**Pannellum**:

- ❌ Rejected: No official React wrapper
- ❌ Requires manual DOM integration
- ✅ Lighter weight (50KB vs 150KB)

**Custom Three.js Implementation**:

- ❌ Rejected: Complex development effort
- ❌ Requires 3D graphics expertise
- ✅ Maximum flexibility
- **Note**: React Photo Sphere Viewer uses Three.js internally

### Implementation Strategy — 360° Tour Editor

```typescript
const TourSceneEditor = ({ scene, onHotspotAdd }) => {
  const handleClick = (data: { yaw: number; pitch: number }) => {
    const hotspot = {
      id: generateId(),
      yaw: data.yaw,
      pitch: data.pitch,
      targetSceneId: null,
      tooltip: "",
    };
    onHotspotAdd(hotspot);
  };

  return (
    <ReactPhotoSphereViewer
      src={scene.panoramaUrl}
      height="100vh"
      width="100vw"
      onClick={handleClick}
      plugins={[MarkersPlugin]}
      markers={scene.hotspots.map((h) => ({
        id: h.id,
        longitude: h.yaw,
        latitude: h.pitch,
        html: `<div class="custom-marker">${h.tooltip}</div>`,
      }))}
    />
  );
};
```

---

## 7. Full-Viewport Canvas Layout Strategy

### Decision: Layout Architecture

**Chosen**: Fixed positioning with overlay panels + CSS Grid for panel layout

### Rationale — Layout

1. **Viewport Coverage**:

   ```css
   .canvas-container {
     position: fixed;
     top: 0;
     left: 0;
     width: 100vw;
     height: 100vh;
     z-index: 0;
   }
   ```

2. **Overlay Panels**:

   ```css
   .overlay-panel {
     position: fixed;
     z-index: 10;
     background: rgba(255, 255, 255, 0.95);
     backdrop-filter: blur(8px);
     box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
   }
   ```

3. **Responsive Layout**:

   - Sidebar: Fixed left (280px width)
   - Toolbar: Fixed top-right (auto height)
   - Properties Panel: Fixed right (400px width, toggleable)
   - Status Bar: Fixed bottom (40px height)

4. **Canvas Interaction**:
   - Pointer events enabled on canvas
   - Overlays have higher z-index
   - Click-through disabled on overlays

### Alternatives Considered — Layout

**CSS Grid Full-Page Layout**:

- ❌ Rejected: Cannot achieve 100vw×100vh canvas with sidebars
- ❌ Grid gaps create unwanted spacing
- ✅ Simpler for responsive layouts (not primary goal)

**Absolute Positioning**:

- ❌ Rejected: Similar to fixed but less predictable
- ❌ Issues with scroll containers
- ✅ Works with relative parents

### Implementation Strategy

```tsx
const AdminLayout = () => (
  <div className="relative w-screen h-screen overflow-hidden">
    {/* Canvas Layer (z-0) */}
    <div className="fixed inset-0 z-0">
      <FullViewportCanvas />
    </div>

    {/* Overlay UI (z-10+) */}
    <AdminSidebar className="fixed left-0 top-0 bottom-0 z-10" />
    <ToolbarOverlay className="fixed top-4 right-4 z-10" />
    <PropertiesPanel className="fixed right-0 top-0 bottom-0 z-20" />
    <StatusBar className="fixed bottom-0 left-0 right-0 z-10" />
  </div>
);
```

---

## 8. Referential Integrity & Validation Strategy

### Decision: Data Validation

**Chosen**: Client-side validation with cascade rules + JSON Schema validation on export

### Data Validation Rationale

1. **Real-time Validation**:

   - Validate as user edits (immediate feedback)
   - Check referential integrity before saves
   - Warn on potential issues (missing hotspots, orphaned links)

2. **Cascade Rules**:

   - Delete building → Warn about floors/units → Offer cascade delete
   - Delete model → Warn about unit references → Offer unlink
   - Delete POI → Auto-delete connected paths (no confirmation)

3. **Export Validation**:
   - Validate against JSON schemas before export
   - Check for required fields
   - Verify all references exist
   - Generate validation report

### Implementation Strategy — Referential Integrity

```typescript
// Referential integrity service
class IntegrityChecker {
  checkBeforeDelete(entityType: string, entityId: string) {
    const dependencies = this.findDependencies(entityType, entityId);

    if (dependencies.length > 0) {
      return {
        canDelete: false,
        warning: `This ${entityType} is used by ${dependencies.length} other entities`,
        dependencies,
        actions: ["Cancel", "Delete Anyway", "Delete All"],
      };
    }

    return { canDelete: true };
  }

  validateExport(config: FullConfig) {
    const errors: ValidationError[] = [];

    // Check all model references
    for (const unit of config.units) {
      if (!config.models.find((m) => m.id === unit.modelId)) {
        errors.push({
          severity: "error",
          entity: "unit",
          id: unit.id,
          message: `References non-existent model ${unit.modelId}`,
        });
      }
    }

    return errors;
  }
}
```

---

## 9. Accessibility Enhancements for Canvas

### Decision: Accessibility Strategy

**Chosen**: Hybrid approach with ARIA annotations + keyboard alternative UI

### Rationale — Accessibility

1. **Canvas Limitations**:

   - Canvas is a bitmap; screen readers see one element
   - No native keyboard navigation for canvas shapes
   - Drag interactions not keyboard-accessible

2. **Mitigation Strategy**:

   - **ARIA Live Regions**: Announce drawing actions
   - **Keyboard Alternatives**: Table view for coordinate editing
   - **Focus Management**: Track selected polygon via state
   - **Alternative Input**: Text fields for coordinate entry

3. **Implementation**:

   ```tsx
   // Canvas with ARIA support
   <div role="application" aria-label="Polygon drawing canvas">
     <Stage {...stageProps}>
       {polygons.map((p) => (
         <Line key={p.id} aria-label={`Polygon ${p.name}`} role="img" {...p} />
       ))}
     </Stage>

     {/* Live region for announcements */}
     <div aria-live="polite" aria-atomic="true" className="sr-only">
       {announcement}
     </div>
   </div>;

   {
     /* Keyboard alternative */
   }
   <table>
     <caption>Polygon Vertices (Keyboard Accessible)</caption>
     <tbody>
       {vertices.map((v, i) => (
         <tr key={i}>
           <td>
             <input value={v.x} onChange={(e) => updateVertex(i, "x", e)} />
           </td>
           <td>
             <input value={v.y} onChange={(e) => updateVertex(i, "y", e)} />
           </td>
         </tr>
       ))}
     </tbody>
   </table>;
   ```

### Future Improvements

- Explore experimental Canvas 2D Context `drawFocusIfNeeded()` API
- Investigate SVG hybrid approach for accessibility
- Add voice control integration

---

## 10. Testing Strategy

### Decision: Testing Approach

**Chosen**: Layered testing with Vitest (unit) + RTL (component) + Playwright (E2E)

### Rationale — Testing

1. **Unit Tests (Vitest)**:

   - Store logic (Zustand actions)
   - Utility functions (coordinate transforms, validation)
   - Service classes (export, import, integrity)
   - Fast execution (<1s for all unit tests)

2. **Component Tests (React Testing Library)**:

   - Individual components in isolation
   - User interaction simulation
   - Accessibility checks (axe-core integration)

3. **E2E Tests (Playwright)**:
   - Complete workflows (create project → add models → export)
   - Canvas interactions (polygon drawing, editing)
   - Multi-page navigation flows
   - Export/import round-trips

### Test Coverage Goals

- Unit tests: 80%+ coverage
- Component tests: All user-facing components
- E2E tests: Critical paths (P1 user stories)

### Implementation Strategy — Testing

```typescript
// Unit test example
describe("IntegrityChecker", () => {
  it("detects orphaned unit references", () => {
    const checker = new IntegrityChecker();
    const config = {
      models: [{ id: "m1" }],
      units: [{ id: "u1", modelId: "m2" }], // m2 doesn't exist
    };

    const errors = checker.validateExport(config);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("non-existent model m2");
  });
});

// E2E test example
test("create and export project", async ({ page }) => {
  await page.goto("/#/admin");

  // Create model
  await page.click("text=Models");
  await page.click('button:has-text("Add Model")');
  await page.fill('input[name="title"]', "Test Model");
  await page.click('button:has-text("Save")');

  // Export
  await page.click('button:has-text("Export")');
  const download = await page.waitForEvent("download");
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
});
```

---

## Summary of Key Decisions

| Area             | Technology                | Key Reason                                |
| ---------------- | ------------------------- | ----------------------------------------- |
| Canvas Drawing   | Konva.js + React-Konva    | Interactive polygon editing, performance  |
| State Management | Zustand                   | Minimal boilerplate, small bundle (1.2KB) |
| Persistence      | Dexie.js (IndexedDB)      | 50MB+ storage, query capabilities         |
| Image Upload     | React Dropzone            | Drag-and-drop, validation, accessibility  |
| Export           | JSZip + FileSaver.js      | Client-side ZIP generation                |
| 360° Tours       | React Photo Sphere Viewer | WebGL panoramas, hotspot support          |
| Testing          | Vitest + RTL + Playwright | Layered testing approach                  |

---

## Open Questions / Future Research

1. **PWA Support**: Consider adding service worker for offline editing
2. **Collaboration**: Multi-user editing with conflict resolution (future phase)
3. **Version History**: Undo/redo with command pattern (nice-to-have)
4. **Performance at Scale**: Test with 100+ buildings, 1000+ units
5. **Mobile Support**: Adapt UI for tablet editing (currently desktop-only)

---

**Next Phase**: Proceed to Phase 1 (Data Model & Contracts)
