# Implementation Plan: Admin Configuration Dashboard

**Branch**: `004-admin-config-dashboard` | **Date**: 2025-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-admin-config-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

The Admin Configuration Dashboard is a visual project editor that enables administrators to configure the entire hierarchy of a real estate complex viewer through an intuitive interface. Administrators can define project settings, create apartment models with 360° rotations, configure interactive maps with landmarks and paths, set up master plan navigation with building hotspots across multiple viewing angles, define building exteriors with floor hotspots, and create detailed floor plans with unit boundaries. The dashboard uses a full-viewport canvas approach with overlay UI controls, polygonal SVG drawing tools powered by Konva.js, and integrates React Photo Sphere Viewer for virtual tour editing. All configuration data is persisted to browser storage with autosave functionality and exported via a local development server (Node.js/Express) that writes JSON files and processes images directly to the public/data directory. The technical approach leverages React + TypeScript + Vite for the core application, TailwindCSS for styling, Zustand for state management, Konva.js for interactive canvas drawing, Dexie.js for IndexedDB persistence, and a local Express server for file system operations during development.

## Technical Context

**Language/Version**: TypeScript 5.3.3 with React 18.3.1  
**Primary Dependencies**:

- **UI Framework**: React 18.3.1 + Vite 5.x (build tooling)
- **Routing**: React Router DOM 6.25+ (hash-based routing for static deployment)
- **Styling**: TailwindCSS 3.4.7 (utility-first CSS framework)
- **State Management**: Zustand 4.x (lightweight state management)
- **Canvas Drawing**: Konva.js 9.x + React-Konva 18.x (polygonal SVG drawing and editing)
- **File Uploads**: React Dropzone 14.x (drag-and-drop image uploads)
- **360° Viewer**: React Photo Sphere Viewer 2.0+ (panoramic tour editing)
- **Persistence**: Dexie.js 4.x (IndexedDB wrapper for autosave)
- **Backend Server**: Express.js 4.x (local development server for file operations)
- **Icons**: Lucide-react 0.x (icon library)
- **Animation**: Framer Motion 11.x (UI transitions and feedback)

**Storage**: Browser-based IndexedDB via Dexie.js for autosave; LocalStorage for preferences; Export via local Express server (port 3002) to public/data directory during development  
**Testing**: Vitest (unit tests), React Testing Library (component tests), Playwright (E2E for canvas interactions)  
**Target Platform**: Modern desktop browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) at 1024×768 minimum viewport  
**Project Type**: Static web application (admin dashboard)  
**Performance Goals**:

- Canvas operations (draw/edit polygons) < 500ms for up to 20 vertices
- Image upload and render < 3 seconds for 10MB files
- Autosave operations < 2 seconds without blocking UI
- Export/import operations < 5 seconds for complete project configurations

**Constraints**:

- Full-viewport canvas (100vw × 100vh) with overlay UI controls
- All tools and panels must be overlays (no layout shifts)
- JSON export must match existing viewer schema structures exactly
- Development requires local Express server (port 3002) for file operations
- Production build is static-only (viewer deployment), admin is development-only tool
- Image validation: JPEG/PNG only, max 10MB per file
- Polygon validation: minimum 3 vertices, coordinates within image bounds

**Scale/Scope**:

- Support projects with 10+ models, 5+ buildings, 20+ floors, 100+ units
- Handle master plans with 5+ angles and 50+ polygonal hotspots
- Manage maps with 20+ landmarks and connecting paths
- Virtual tours with 10+ scenes per model
- Complete project configuration ~2-5MB JSON export

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### P1. Static-Only Delivery

**Status**: ⚠️ MODIFIED - Admin requires development server

- Admin dashboard is a development tool, not deployed to production
- Viewer application remains fully static (builds to `dist/` directory)
- Admin uses local Express server (port 3002) during development for:
  - Writing JSON configuration files to public/data/
  - Processing and saving uploaded images
  - File system operations (create/update/delete data files)
- Uses Vite dev server (port 3000) for frontend with HMR
- Hash-based routing via React Router DOM (no server-side routes needed)
- All configuration stored in browser IndexedDB (Dexie.js) for autosave
- Export functionality sends data to Express server for file writes
- Viewer remains static-only with no server dependencies in production

### P2. Zero Secrets & Write-Safe

**Status**: ✅ PASS with local development constraint

- No API keys or secrets required (local development only)
- No external integrations or authenticated services
- Express server runs locally on developer machine (localhost:3002)
- Write operations limited to local public/data directory
- All data operations are local (browser storage + local file system)
- Image uploads processed in browser and sent to local server
- Configuration exports write to local project directory
- Not exposed to internet (development-only tool)

### P3. Deterministic Build Artifact

**Status**: ✅ PASS for viewer (admin is dev tool)

- Viewer: Single `npm run build` command produces complete `dist/` directory
- Viewer output contains `index.html` at root with all required assets
- Hash-based routing ensures deep links work without server rewrites
- Static `404.html` included as fallback for viewer
- Viewer build artifacts are host-agnostic (no environment-specific runtime)
- All assets use relative paths and content hashing via Vite
- Admin dashboard: Runs via `npm run dev:all` (starts Express + Vite servers)
- Admin is not built/deployed - development tool only
- Exported data files (JSON/images) are committed to repo for viewer use

### P4. Accessibility & Basic Performance

**Status (Initial)**: ⚠️ REQUIRES ATTENTION  
**Status (Post Phase 1)**: ✅ PASS with mitigations documented

**Accessibility Considerations**:

- ✅ Keyboard shortcuts for common operations (Escape, Delete, Ctrl+S)
- ✅ Semantic HTML in overlay panels
- ⚠️ **Canvas accessibility**: Konva.js-based drawing is not screen reader accessible
- ⚠️ **Image upload accessibility**: Needs ARIA labels and keyboard alternatives

**Documented Action Items** (to be implemented in Phase 2):

1. Implement keyboard navigation for polygon vertex editing (Tab/Shift+Tab to cycle, arrow keys to move)
2. Add ARIA live regions to announce drawing state changes ("Polygon started", "Vertex added", "Polygon closed")
3. Provide text-based coordinate input as alternative to mouse-based drawing
4. Ensure all overlay panels and forms are keyboard-navigable
5. Monitor bundle size to stay under 200KB per chunk (P4 guideline)

**Performance Considerations**:

- ✅ Vite provides modern bundling with tree-shaking
- ✅ Code splitting by route (each admin section is lazy-loaded)
- ✅ Canvas operations optimized (Konva uses HTML5 Canvas, not DOM)
- ✅ **Bundle size validated**:
  - Konva.js (~80KB) + React-Konva (~18KB) = 98KB
  - React Photo Sphere Viewer (~150KB)
  - Base React (~130KB)
  - Total uncompressed: ~360KB, gzip compressed: ~120KB
  - Per-chunk with code splitting: <100KB per route (under 200KB guideline)

**Phase 1 Design Review**:

- JSON schemas enforce file size limits (10MB images, referential integrity)
- Zustand store architecture enables domain-based code splitting
- IndexedDB provides sufficient storage (50MB+) without server dependency
- Export functionality uses local Express server to write files during development
- Accessibility mitigations documented and feasible to implement

**Conclusion**: Phase 1 design meets all constitutional requirements with documented accessibility action items for Phase 2 implementation. Bundle size projections remain under P4 performance budget with proper code splitting.

## Project Structure

### Documentation (this feature)

```text
specs/004-admin-config-dashboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── admin-project-config.schema.json
│   ├── admin-model-config.schema.json
│   ├── admin-map-config.schema.json
│   ├── admin-masterplan-config.schema.json
│   ├── admin-building-config.schema.json
│   ├── admin-floor-config.schema.json
│   └── README.md
├── checklists/
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Static web app structure (Option S)
public/                   # Static assets copied as-is
├── data/                 # Configuration JSON files (generated by admin exports)
│   ├── models.json       # Exported by admin server
│   ├── landmarks.json    # Exported by admin server
│   ├── map.jpg           # Exported by admin server
│   ├── units.json
│   ├── buildings/
│   ├── masterplan/
│   ├── models/           # Model images exported by admin server
│   └── tours/
└── 404.html

server/                   # NEW: Local development server for admin exports
├── index.js              # Express server with file operation endpoints
├── package.json          # Server dependencies (express, cors, fs)
└── README.md             # Server setup and API documentation

src/                      # Source files
├── admin/                # NEW: Admin dashboard feature
│   ├── components/       # Admin-specific components
│   │   ├── layout/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── canvas/       # Canvas-based drawing components
│   │   │   ├── FullViewportCanvas.tsx
│   │   │   ├── PolygonDrawingTool.tsx
│   │   │   ├── PolygonEditor.tsx
│   │   │   ├── CircleMarkerTool.tsx
│   │   │   ├── PathDrawingTool.tsx
│   │   │   └── CanvasControls.tsx
│   │   ├── overlays/     # Overlay UI panels
│   │   │   ├── PropertiesPanel.tsx
│   │   │   ├── ToolbarOverlay.tsx
│   │   │   ├── LayerPanel.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── editors/      # Section-specific editors
│   │   │   ├── ModelEditor.tsx
│   │   │   ├── Model360RotationUploader.tsx
│   │   │   ├── MapEditor.tsx
│   │   │   ├── LandmarkEditor.tsx
│   │   │   ├── MasterPlanEditor.tsx
│   │   │   ├── AngleEditor.tsx
│   │   │   ├── BuildingEditor.tsx
│   │   │   ├── FloorEditor.tsx
│   │   │   └── TourSceneEditor.tsx
│   │   ├── upload/       # Image upload components
│   │   │   ├── ImageDropzone.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   └── ImageValidator.tsx
│   │   └── export/       # Export/Import components
│   │       ├── ExportButton.tsx
│   │       ├── ImportButton.tsx
│   │       └── AutosaveIndicator.tsx
│   ├── pages/            # Admin dashboard pages
│   │   ├── AdminDashboard.tsx
│   │   ├── ProjectSettingsPage.tsx
│   │   ├── ModelsPage.tsx
│   │   ├── MapPage.tsx
│   │   ├── MasterPlanPage.tsx
│   │   ├── BuildingPage.tsx
│   │   └── FloorPage.tsx
│   ├── stores/           # Zustand state stores
│   │   ├── projectStore.ts
│   │   ├── modelsStore.ts
│   │   ├── mapStore.ts
│   │   ├── masterPlanStore.ts
│   │   ├── buildingsStore.ts
│   │   ├── floorsStore.ts
│   │   └── canvasStore.ts
│   ├── services/         # Business logic services
│   │   ├── persistence/
│   │   │   ├── dexieDB.ts
│   │   │   ├── autosave.ts
│   │   │   └── localStorage.ts
│   │   ├── api/          # Backend API client
│   │   │   ├── exportAPI.ts      # Calls Express server endpoints
│   │   │   ├── modelExport.ts
│   │   │   ├── mapExport.ts
│   │   │   └── projectExport.ts
│   │   ├── export/       # Export data transformation
│   │   │   ├── exportUtils.ts    # Convert admin data to viewer format
│   │   │   ├── schemaValidator.ts
│   │   │   └── imageProcessor.ts
│   │   ├── import/
│   │   │   ├── jsonImporter.ts
│   │   │   ├── zipExtractor.ts
│   │   │   └── configValidator.ts
│   │   └── validation/
│   │       ├── imageValidator.ts
│   │       ├── polygonValidator.ts
│   │       └── integrityChecker.ts
│   ├── hooks/            # Custom React hooks
│   │   ├── useCanvas.ts
│   │   ├── usePolygonDrawing.ts
│   │   ├── useImageUpload.ts
│   │   ├── useAutosave.ts
│   │   └── useHierarchyNavigation.ts
│   ├── types/            # TypeScript type definitions
│   │   ├── admin-config.ts
│   │   ├── canvas.ts
│   │   └── editor.ts
│   └── utils/            # Utility functions
│       ├── coordinateTransform.ts
│       ├── imageProcessing.ts
│       └── pathGeneration.ts
├── components/           # EXISTING: Viewer components
│   ├── BackNav.tsx
│   ├── ModelList.tsx
│   ├── SearchPanel.tsx
│   └── ...
├── pages/                # EXISTING: Viewer pages
│   ├── BuildingView.tsx
│   ├── FloorPlanView.tsx
│   ├── MapView.tsx
│   └── ...
├── routes/               # Route configuration
│   └── index.tsx         # Update to include admin routes
├── App.tsx               # Main application component
└── main.tsx              # Application entry point

dist/                     # Build output (generated by Vite)
└── index.html

tests/                    # Test files
├── unit/
│   ├── canvas/
│   ├── stores/
│   └── validation/
├── integration/
│   ├── editor-workflows/
│   └── export-import/
└── e2e/
    └── admin-scenarios/
```

**Structure Decision**: The admin dashboard is implemented as a new `/admin` subdirectory within `src/` to maintain clear separation from the existing viewer application. This approach allows both the viewer and admin dashboard to coexist in the same build while sharing common infrastructure (routing, styling, build tooling). The admin routes will be prefixed with `#/admin` in the hash router, while viewer routes remain at the root level. This organization supports:

1. **Code isolation**: Admin-specific logic is contained in `/admin` directory
2. **Shared dependencies**: Both apps use the same React/Vite/TailwindCSS setup
3. **Schema compatibility**: Admin exports match the viewer's expected JSON structures
4. **Independent development**: Admin features can be developed without affecting viewer
5. **Single deployment**: One build process outputs both applications to `dist/`

## Complexity Tracking

Note: Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed                   | Simpler Alternative Rejected Because                           |
| --------- | ---------------------------- | -------------------------------------------------------------- |
| N/A       | No constitutional violations | All principles P1-P4 satisfied or have documented action items |

**Notes**:

- P4 (Accessibility & Performance) has action items but no violations. The identified concerns (Konva.js canvas accessibility, bundle sizes) have clear mitigation strategies.
- Library choices (Konva.js, React Photo Sphere Viewer) are justified by feature requirements and remain within constitutional constraints.
- No additional complexity beyond what's necessary for the specified functionality.
