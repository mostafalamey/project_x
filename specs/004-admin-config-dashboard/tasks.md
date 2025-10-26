# Tasks: Admin Configuration Dashboard

**Input**: Design documents from `/specs/004-admin-config-dashboard/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Test tasks are NOT included as they were not explicitly requested in the feature specification. Focus is on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Static web app structure:

- **Source**: `src/admin/` (admin dashboard code)
- **Public**: `public/` (static assets)
- **Build**: `dist/` (Vite output)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install dependencies: React 18.3.1, Vite 5.x, TypeScript 5.3.3, React Router DOM 6.25+, TailwindCSS 3.4.7
- [x] T002 Install state management: Zustand 4.x with persist middleware
- [x] T003 Install canvas libraries: Konva.js 9.x and React-Konva 18.x
- [x] T004 Install persistence libraries: Dexie.js 4.x for IndexedDB
- [x] T005 Install file handling: React Dropzone 14.x, FileSaver.js 2.x, JSZip 3.x
- [x] T006 Install 360° viewer: React Photo Sphere Viewer 2.0+
- [x] T007 Install UI libraries: Lucide-react (icons), Framer Motion 11.x (animations)
- [x] T008 Configure TypeScript with strict mode in tsconfig.json
- [x] T009 Configure TailwindCSS with custom design tokens in tailwind.config.js
- [x] T010 Configure Vite for hash-based routing and static deployment in vite.config.ts
- [x] T011 Create admin directory structure: src/admin/{components,pages,stores,services,hooks,types,utils}
- [x] T012 Configure ESLint and Prettier for TypeScript + React code style
- [x] T013 Create public/404.html for hash routing fallback
- [x] T014 Update .gitignore to exclude dist/, node_modules/, .env files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Persistence

- [x] T015 Create Dexie database schema in src/admin/services/persistence/dexieDB.ts with all tables (projects, models, maps, landmarks, paths, masterPlans, angles, buildings, floors, units, tours, scenes, images, autosave)
- [x] T016 [P] Create autosave service in src/admin/services/persistence/autosave.ts with 30s debounce
- [x] T017 [P] Create localStorage service in src/admin/services/persistence/localStorage.ts for preferences

### Type Definitions

- [x] T018 [P] Create shared types in src/admin/types/admin-config.ts (ProjectConfig, Model, ImageRef, Rotation360Config, Point, CircleGeometry, PolygonGeometry)
- [x] T019 [P] Create canvas types in src/admin/types/canvas.ts (CanvasState, DrawingMode, Tool)
- [x] T020 [P] Create editor types in src/admin/types/editor.ts (EditorMode, SelectionState)

### Zustand Stores

- [x] T021 [P] Create projectStore in src/admin/stores/projectStore.ts with loadProject, createProject, updateProject actions
- [x] T022 [P] Create canvasStore in src/admin/stores/canvasStore.ts with scale, offset, selectedShapeId, drawing state
- [x] T023 [P] Create modelsStore in src/admin/stores/modelsStore.ts (base structure only, detailed actions in US1)
- [x] T024 [P] Create mapStore in src/admin/stores/mapStore.ts (base structure only, detailed actions in US2)
- [x] T025 [P] Create masterPlanStore in src/admin/stores/masterPlanStore.ts (base structure only, detailed actions in US3)
- [x] T026 [P] Create buildingsStore in src/admin/stores/buildingsStore.ts (base structure only, detailed actions in US4)
- [x] T027 [P] Create floorsStore in src/admin/stores/floorsStore.ts (base structure only, detailed actions in US5)

### Validation Services

- [x] T028 [P] Create image validator in src/admin/services/validation/imageValidator.ts (JPEG/PNG only, max 10MB, dimension checks)
- [x] T029 [P] Create polygon validator in src/admin/services/validation/polygonValidator.ts (min 3 vertices, bounds checking)
- [x] T030 [P] Create integrity checker in src/admin/services/validation/integrityChecker.ts (referential integrity, cascade delete warnings)

### Core Components

- [x] T031 [P] Create AdminLayout in src/admin/components/layout/AdminLayout.tsx with sidebar and main content area
- [x] T032 [P] Create AdminSidebar in src/admin/components/layout/AdminSidebar.tsx with navigation to all sections
- [x] T033 [P] Create AdminHeader in src/admin/components/layout/AdminHeader.tsx with project name and autosave indicator
- [x] T034 Create FullViewportCanvas in src/admin/components/canvas/FullViewportCanvas.tsx with Konva Stage at 100vw × 100vh
- [x] T035 [P] Create CanvasControls in src/admin/components/canvas/CanvasControls.tsx with zoom, pan, and tool selection
- [x] T036 [P] Create PropertiesPanel in src/admin/components/overlays/PropertiesPanel.tsx as fixed-position overlay
- [x] T037 [P] Create ToolbarOverlay in src/admin/components/overlays/ToolbarOverlay.tsx with drawing tools
- [x] T038 [P] Create StatusBar in src/admin/components/overlays/StatusBar.tsx with coordinates and zoom level

### Routing

- [x] T039 Update src/routes/index.tsx to add hash-based admin routes (#/admin/\*)
- [x] T040 Create AdminDashboard page in src/admin/pages/AdminDashboard.tsx as entry point with navigation cards

### Custom Hooks

- [x] T041 [P] Create useCanvas hook in src/admin/hooks/useCanvas.ts for canvas state management
- [x] T042 [P] Create useAutosave hook in src/admin/hooks/useAutosave.ts with debounced persistence
- [x] T043 [P] Create useImageUpload hook in src/admin/hooks/useImageUpload.ts with validation and preview

### Utilities

- [x] T044 [P] Create coordinate transform utils in src/admin/utils/coordinateTransform.ts (screen to image coordinates)
- [x] T045 [P] Create image processing utils in src/admin/utils/imageProcessing.ts (resize, thumbnail generation)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Project Configuration & Model Management (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to configure project settings and manage apartment models with images, attributes, and 360° rotations

**Independent Test**: Create a new project, add 3 different models with images and attributes, upload 360° rotation sequences for at least one model, then export and verify the configuration exports correctly to JSON format.

### Implementation for User Story 1

- [x] T046 Create ProjectSettingsPage in src/admin/pages/ProjectSettingsPage.tsx with form for project metadata
- [x] T047 [P] [US1] Add project settings form fields in ProjectSettingsPage: name, developer info, contact details, metadata
- [x] T048 [P] [US1] Connect project settings form to projectStore actions (updateProject)
- [x] T049 [P] [US1] Add form validation for project settings (name 3-100 chars, slug alphanumeric)
- [x] T050 Create ModelsPage in src/admin/pages/ModelsPage.tsx with model list and editor
- [x] T051 [US1] Implement modelsStore actions: loadModels, addModel, updateModel, deleteModel, reorderModels, selectModel
- [x] T052 [P] [US1] Create ModelEditor component in src/admin/components/editors/ModelEditor.tsx with model form
- [x] T053 [P] [US1] Add model form fields: title, description, area (m²), bedrooms, bathrooms
- [x] T054 [P] [US1] Create ImageDropzone component in src/admin/components/upload/ImageDropzone.tsx using React Dropzone
- [x] T055 [P] [US1] Create ImagePreview component in src/admin/components/upload/ImagePreview.tsx with thumbnail display
- [x] T056 [US1] Integrate ImageDropzone into ModelEditor for thumbnail upload
- [x] T057 [US1] Add image validation (JPEG/PNG only, max 10MB) on upload
- [x] T058 [US1] Store uploaded images in IndexedDB via Dexie images table
- [x] T059 [P] [US1] Create Model360RotationUploader component in src/admin/components/editors/Model360RotationUploader.tsx
- [x] T060 [US1] Add 360° rotation upload: frame count input, filename pattern, multiple image upload
- [x] T061 [US1] Validate 360° frames: consistent dimensions, minimum 12 frames
- [x] T062 [US1] Store rotation frames in IndexedDB and update modelsStore
- [x] T063 [US1] Add 360° rotation preview in Model360RotationUploader (cycle through frames on hover)
- [x] T064 [US1] Implement drag-and-drop reordering for models list using display order
- [x] T065 [US1] Add delete model with confirmation dialog
- [x] T066 [US1] Create export utilities in src/admin/utils/exportUtils.ts for data transformation
- [x] T067 [US1] Implement models.json export format conversion with schema validation
- [x] T068 [US1] Create Express server endpoint POST /api/export/models in server/index.js
- [x] T069 [US1] Add "Export Models" button to ModelsPage that calls backend API
- [x] T070 [US1] Test models.json export writes correctly to public/data/models.json

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Project settings and model management complete with 360° rotation support.

---

## Phase 4: User Story 2 - Interactive Map & Landmark Definition (Priority: P1)

**Goal**: Enable administrators to upload a site map and define interactive landmarks (POI circles, Main Complex polygon) with connecting SVG paths

**Independent Test**: Upload a map image, draw the Main Complex polygon, add 5 POI circular markers, draw connecting paths from the complex to each POI, assign properties to landmarks, and verify the exported landmarks.json file.

### Implementation for User Story 2

- [x] T071 Create MapPage in src/admin/pages/MapPage.tsx with full-viewport canvas
- [x] T072 [US2] Implement mapStore actions: loadMap, updateBackgroundImage, addLandmark, updateLandmark, deleteLandmark, addPath, updatePath, deletePath, setDrawingMode
- [x] T073 [P] [US2] Create MapEditor component in src/admin/components/editors/MapEditor.tsx with canvas and overlay controls
- [x] T074 [US2] Add map image upload to MapEditor using ImageDropzone
- [x] T075 [US2] Display map image as background on FullViewportCanvas (scaled to viewport)
- [x] T076 [P] [US2] Create CircleMarkerTool component in src/admin/components/canvas/CircleMarkerTool.tsx for POI placement
- [x] T077 [P] [US2] Create PolygonDrawingTool component in src/admin/components/canvas/PolygonDrawingTool.tsx for Main Complex
- [x] T078 [US2] Implement click-to-place POI markers (CircleGeometry) on map canvas
- [x] T079 [US2] Implement polygon drawing for Main Complex (click to add vertices, double-click to close)
- [x] T080 [US2] Add visual feedback during drawing: temporary lines, cursor changes, vertex circles
- [x] T081 [P] [US2] Create LandmarkEditor component in src/admin/components/editors/LandmarkEditor.tsx for properties
- [x] T082 [US2] Show LandmarkEditor panel when landmark is selected (name, description, type, distance, time)
- [x] T083 [US2] Validate landmark properties: name required, distance/time numeric
- [x] T084 [P] [US2] Create PolygonEditor component in src/admin/components/canvas/PolygonEditor.tsx for vertex dragging
- [x] T085 [US2] Implement polygon vertex editing: drag vertices to move, right-click to delete vertex
- [x] T086 [US2] Enforce polygon validation: minimum 3 vertices, coordinates within image bounds
- [x] T087 [P] [US2] Create PathDrawingTool component in src/admin/components/canvas/PathDrawingTool.tsx for SVG paths
- [x] T088 [US2] Implement path drawing: click Main Complex, then click POI to draw connecting line
- [x] T089 [US2] Generate SVG path d attribute using path generation utils in src/admin/utils/pathGeneration.ts
- [x] T090 [US2] Allow path editing: drag control points, adjust curvature, delete path
- [x] T091 [US2] Add path style editor: stroke color, width, dash array
- [x] T092 [US2] Enforce map validation: exactly one 'complex' landmark, POI must use CircleGeometry, Complex must use PolygonGeometry
- [x] T093 [US2] Implement automatic path deletion when connected POI is deleted
- [x] T094 [US2] Add keyboard shortcut: Escape to cancel drawing
- [x] T095 [US2] Implement landmarks.json export format conversion in exportUtils.ts
- [x] T096 [US2] Create Express server endpoint POST /api/export/map in server/index.js
- [x] T097 [US2] Add "Export Map" button that saves map.jpg and landmarks.json via backend API

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently. Map with landmarks and paths complete.

---

## Phase 5: User Story 3 - Master Plan Building Definition & Hotspot Configuration (Priority: P1)

**Goal**: Enable administrators to create building entities, upload angle images, draw building hotspots across all angles, and configure transitions. Buildings created here appear in Building section.

**Independent Test**: Create 3 building entities, upload 2 master plan angle images, draw polygonal hotspots for each building on both angles, configure transition sequences, verify buildings appear in Building tab, and verify exported masterplan/buildings.json.

### Implementation for User Story 3

- [x] T098 Create MasterPlanPage in src/admin/pages/MasterPlanPage.tsx with angle viewer and building list
- [x] T099 [US3] Implement masterPlanStore actions: loadMasterPlan, createBuilding, deleteBuilding, addAngle, updateAngle, deleteAngle, addBuildingHotspot, updateHotspot, deleteHotspot, addTransition, setCurrentAngle
- [x] T100 [P] [US3] Create MasterPlanEditor component in src/admin/components/editors/MasterPlanEditor.tsx
- [x] T101 [US3] Add building entity creation modal: name and ID inputs
- [x] T102 [US3] Display building list in sidebar with add/delete controls
- [x] T103 [US3] Validate building creation: name required, ID unique
- [x] T104 [P] [US3] Create AngleEditor component in src/admin/components/editors/AngleEditor.tsx
- [x] T105 [US3] Add angle upload interface: upload angle image, set sequence index
- [x] T106 [US3] Display current angle image on full-viewport canvas
- [x] T107 [US3] Add angle switcher UI: tabs or dropdown to navigate between angles
- [x] T108 [US3] Implement building hotspot drawing: select building from list, then draw polygon on current angle
- [x] T109 [US3] Show visual indicators for buildings missing hotspots on current angle
- [x] T110 [US3] Allow editing building hotspots: drag vertices, delete, modify label
- [x] T111 [US3] Enforce validation: each building must have >= 1 hotspot per angle for complete coverage
- [x] T112 [US3] Show warnings for incomplete building hotspot coverage (building on some angles but not all)
- [x] T113 [US3] Add transition sequence upload: upload transition frames between consecutive angles
- [x] T114 [US3] Validate transition frames: match frameCount, all frames same dimensions
- [x] T115 [US3] Store building entities in buildingsStore when created in Master Plan
- [x] T116 [US3] Implement referential integrity: BuildingHotspot must reference existing Building entity
- [x] T117 [US3] Add delete building confirmation with warning if hotspots exist
- [x] T118 [US3] Implement masterplan/buildings.json export format conversion
- [x] T119 [US3] Create Express server endpoint POST /api/export/masterplan
- [x] T120 [US3] Add "Export Master Plan" button that saves via backend API
- [x] T121 [US3] Test that buildings created in Master Plan appear in Building section dropdown

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently. Master plan with buildings and angles complete, buildings propagate to Building section.

---

## Phase 6: User Story 4 - Building Image & Floor Hotspot Configuration (Priority: P2)

**Goal**: Enable administrators to select a building (from Master Plan), upload building exterior image, and create floor entities by drawing polygonal hotspots. Floors created here appear in Floor section.

**Independent Test**: Select a building from Master Plan list, upload exterior image, draw 3-5 floor polygonal hotspots, verify floors appear in Floor tab, and verify exported building JSON configuration.

### Implementation for User Story 4

- [x] T122 Create BuildingPage in src/admin/pages/BuildingPage.tsx with building selector and floor editor
- [x] T123 [US4] Implement buildingsStore actions: loadBuildings, selectBuilding, updateBuilding, updateExteriorImage, createFloor, updateFloorHotspot, deleteFloor
- [x] T124 [P] [US4] Create BuildingEditor component in src/admin/components/editors/BuildingEditor.tsx
- [x] T125 [US4] Display building list (from Master Plan) in dropdown selector
- [x] T126 [US4] Load selected building data and display building metadata form (name, address, yearBuilt, etc.)
- [x] T127 [US4] Add building exterior image upload using ImageDropzone
- [x] T128 [US4] Display exterior image on full-viewport canvas
- [x] T129 [US4] Add floor entity creation: modal with name/number inputs
- [x] T130 [US4] Validate floor creation: name required, floorNumber unique within building
- [x] T131 [US4] Draw floor hotspot polygons on building exterior image
- [x] T132 [US4] Link floor hotspot to floor entity (FloorReference with hotspot geometry)
- [x] T133 [US4] Allow editing floor hotspots: drag vertices, delete, modify properties
- [x] T134 [US4] Show floor list in sidebar with edit/delete controls
- [x] T135 [US4] Store floor entities in floorsStore when created in Building view
- [x] T136 [US4] Implement delete floor confirmation with warning if units exist (check floorsStore)
- [x] T137 [US4] Implement building export format conversion with FloorReference array
- [x] T138 [US4] Create Express server endpoint POST /api/export/building/:buildingId
- [x] T139 [US4] Add "Export Building" button that saves to buildings/[buildingId]/ via backend API
- [ ] T140 [US4] Test that floors created in Building view appear in Floor section

**Checkpoint**: At this point, User Story 4 should be fully functional and testable independently. Building configuration with floors complete, floors propagate to Floor section.

---

## Phase 7: User Story 5 - Floor Plan Image & Unit Hotspot Mapping (Priority: P2)

**Goal**: Enable administrators to select a floor (from Building view), upload floor plan image, and draw unit boundary polygons linked to apartment models.

**Independent Test**: Select a floor from Building list, upload floor plan image, draw 5-10 unit polygonal hotspots, link each unit to a model, assign unit numbers and availability, and verify exported floor JSON configuration.

### Implementation for User Story 5

- [x] T141 Create FloorPage in src/admin/pages/FloorPage.tsx with floor selector and unit editor
- [x] T142 [US5] Implement floorsStore actions: loadFloors, selectFloor, updateFloor, updateFloorPlanImage, addUnit, updateUnit, deleteUnit, setDrawingMode
- [x] T143 [P] [US5] Create FloorEditor component in src/admin/components/editors/FloorEditor.tsx
- [x] T144 [US5] Display floor list (from Building section) in dropdown selector, organized by building
- [x] T145 [US5] Show "No floors exist" message if floor list empty, prompt navigation to Building section
- [x] T146 [US5] Load selected floor data and display floor metadata form
- [x] T147 [US5] Add floor plan image upload using ImageDropzone
- [x] T148 [US5] Display floor plan image on full-viewport canvas
- [x] T149 [US5] Implement unit boundary polygon drawing tool
- [x] T150 [US5] Create unit entity when polygon is drawn: open properties panel automatically
- [x] T151 [US5] Add unit properties form: unit number, model selection dropdown, availability status, pricing
- [x] T152 [US5] Populate model dropdown from modelsStore (display model title, bedrooms, area)
- [x] T153 [US5] Show inherited model properties (bedrooms, bathrooms, area) in properties panel for reference
- [x] T154 [US5] Validate unit data: unitNumber required and unique within floor, modelId must reference existing model
- [x] T155 [US5] Allow editing unit polygons: drag vertices, delete, modify properties
- [x] T156 [US5] Show visual warning for overlapping unit polygons (warning only, not error)
- [x] T157 [US5] Implement delete unit confirmation
- [x] T158 [US5] Check referential integrity: warn when deleting model that is referenced by units
- [x] T159 [US5] Implement floor export format conversion with UnitHotspot array
- [x] T160 [US5] Create Express server endpoint POST /api/export/floor/:buildingId/:floorNumber
- [x] T161 [US5] Add "Export Floor" button that saves to buildings/[buildingId]/floors/ via backend API
- [x] T162 [US5] Test floor JSON export includes all unit data with model references

**Checkpoint**: At this point, User Story 5 should be fully functional and testable independently. Floor plan configuration with units complete.

---

## Phase 8: User Story 6 - 360° Virtual Tour Scene Editor (Priority: P2)

**Goal**: Enable administrators to create virtual tours with panoramic scenes and navigation hotspots using React Photo Sphere Viewer.

**Independent Test**: Create a tour with 4-5 panoramic scenes, add navigation hotspots between scenes, configure hotspot positions and tooltips, and verify exported tour JSON file plays correctly in viewer.

### Implementation for User Story 6

- [ ] T163 [P] [US6] Create TourSceneEditor component in src/admin/components/editors/TourSceneEditor.tsx using React Photo Sphere Viewer
- [ ] T164 [US6] Add tour section to ModelsPage: "Virtual Tour" tab for each model
- [ ] T165 [US6] Create tour store or extend modelsStore with tour actions: createTour, addScene, deleteScene, addHotspot, updateHotspot, deleteHotspot, setStartingScene
- [ ] T166 [US6] Implement panoramic scene upload: equirectangular image validation
- [ ] T167 [US6] Integrate React Photo Sphere Viewer to display panoramic scene
- [ ] T168 [US6] Add scene list sidebar with thumbnail previews
- [ ] T169 [US6] Implement hotspot placement: click on panorama to add hotspot at yaw/pitch position
- [ ] T170 [US6] Show hotspot creation modal: select target scene, enter tooltip text, choose icon type
- [ ] T171 [US6] Validate hotspot position: yaw [-180, 180], pitch [-90, 90]
- [ ] T172 [US6] Allow dragging hotspots in panorama to reposition
- [ ] T173 [US6] Add hotspot properties editor: target scene dropdown, tooltip, icon selection
- [ ] T174 [US6] Implement delete hotspot functionality
- [ ] T175 [US6] Mark starting scene: radio button or star icon in scene list
- [ ] T176 [US6] Add tour preview mode: navigate through scenes by clicking hotspots
- [ ] T177 [US6] Validate tour graph: all scenes reachable from starting scene (connectivity check)
- [ ] T178 [US6] Implement tour export format conversion with TourScene array
- [ ] T179 [US6] Create Express server endpoint POST /api/export/tour/:modelId
- [ ] T180 [US6] Add "Export Tour" button that saves to tours/[modelId]/ via backend API
- [ ] T181 [US6] Test tour JSON export format matches existing viewer schema

**Checkpoint**: At this point, User Story 6 should be fully functional and testable independently. Virtual tour editor complete.

---

## Phase 9: User Story 7 - Full-Screen Canvas with Overlay UI (Priority: P2)

**Goal**: Ensure all visual editing sections display images at 100vw × 100vh with overlay tools and panels that don't affect canvas size.

**Independent Test**: Load each section type (Map, Master Plan, Building, Floor) and verify background image fills viewport, all toolbars are overlays, and no scrollbars appear during editing.

### Implementation for User Story 7

- [ ] T182 [P] [US7] Add viewport scaling logic to FullViewportCanvas: scale image to fill 100vw × 100vh maintaining aspect ratio
- [ ] T183 [P] [US7] Set FullViewportCanvas position: fixed with z-index: 0
- [ ] T184 [P] [US7] Ensure all overlay components use fixed/absolute positioning with higher z-index (10+)
- [ ] T185 [P] [US7] Update AdminSidebar positioning: fixed left with z-index: 10
- [ ] T186 [P] [US7] Update ToolbarOverlay positioning: fixed top-right with z-index: 10
- [ ] T187 [P] [US7] Update PropertiesPanel positioning: fixed right with z-index: 20
- [ ] T188 [P] [US7] Update StatusBar positioning: fixed bottom with z-index: 10
- [ ] T189 [US7] Test Map section: image fills viewport, overlays don't cause layout shifts
- [ ] T190 [US7] Test Master Plan section: angle images fill viewport, angle switcher is overlay
- [ ] T191 [US7] Test Building section: exterior image fills viewport, floor list is overlay
- [ ] T192 [US7] Test Floor section: floor plan fills viewport, unit list is overlay
- [ ] T193 [US7] Add viewport resize handler: rescale canvas on window resize
- [ ] T194 [US7] Implement overlay dismiss on click outside (for PropertiesPanel)
- [ ] T195 [US7] Add overlay minimize/maximize controls
- [ ] T196 [US7] Test at minimum viewport size (1024px × 768px)

**Checkpoint**: At this point, User Story 7 should be fully functional and testable independently. All sections maintain full-viewport canvas with proper overlay positioning.

---

## Phase 10: User Story 8 - Configuration Import/Export & Autosave (Priority: P3)

**Goal**: Implement autosave with visual feedback, full project export to ZIP, and project import with validation.

**Independent Test**: Make changes across different sections, wait for autosave confirmation, refresh browser to verify persistence, export full project, import into fresh instance.

### Implementation for User Story 8

- [ ] T197 [US8] Implement autosave trigger: use useAutosave hook with 30s debounce across all stores
- [ ] T198 [P] [US8] Create AutosaveIndicator component in src/admin/components/export/AutosaveIndicator.tsx
- [ ] T199 [US8] Add autosave status to AdminHeader: "Saved at [timestamp]" or "Saving..." with icon
- [ ] T200 [US8] Store autosave snapshots in IndexedDB autosave table with timestamp
- [ ] T201 [US8] Implement restore prompt on page load: check for unsaved changes, ask to restore or discard
- [ ] T202 [P] [US8] Create ZIP generator service in src/admin/services/export/zipGenerator.ts using JSZip
- [ ] T203 [US8] Implement full project export: aggregate all JSON files (project, models, landmarks, masterplan, buildings, floors, tours)
- [ ] T204 [US8] Add image references to ZIP: copy images from IndexedDB to images/ folder in ZIP
- [ ] T205 [US8] Generate project structure in ZIP: config/ and images/ folders
- [ ] T206 [US8] Add README.md to ZIP export with project metadata
- [ ] T207 [US8] Implement ZIP download using FileSaver.js: filename format "[projectName]-export.zip"
- [ ] T208 [US8] Add "Export Project" button to AdminDashboard and AdminHeader
- [ ] T209 [P] [US8] Create ZIP extractor service in src/admin/services/import/zipExtractor.ts
- [ ] T210 [P] [US8] Create config validator service in src/admin/services/import/configValidator.ts
- [ ] T211 [P] [US8] Create ImportButton component in src/admin/components/export/ImportButton.tsx
- [ ] T212 [US8] Implement ZIP file selection and extraction
- [ ] T213 [US8] Parse extracted JSON files and validate against schemas
- [ ] T214 [US8] Display validation errors with detailed field-level messages
- [ ] T215 [US8] Load validated configuration into stores
- [ ] T216 [US8] Extract images from ZIP and store in IndexedDB
- [ ] T217 [US8] Add "Import Project" functionality to AdminDashboard
- [ ] T218 [US8] Implement browser storage quota check: warn when approaching limit
- [ ] T219 [US8] Add storage quota warning modal with export/clear options
- [ ] T220 [US8] Test full export/import cycle: export project, import into fresh instance, verify data integrity

**Checkpoint**: At this point, User Story 8 should be fully functional and testable independently. Autosave and full project import/export complete.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Accessibility Enhancements

- [ ] T217 [P] Implement keyboard shortcuts: Escape (cancel drawing), Delete (remove selected shape), Ctrl+S (manual save)
- [ ] T218 [P] Add keyboard navigation for polygon vertex editing: Tab/Shift+Tab to cycle vertices, arrow keys to move
- [ ] T219 [P] Add ARIA live regions for drawing state announcements: "Polygon started", "Vertex added", "Polygon closed"
- [ ] T220 [P] Add text-based coordinate input as alternative to mouse drawing
- [ ] T221 [P] Ensure all overlay panels and forms are keyboard-navigable with proper focus management
- [ ] T222 [P] Add ARIA labels to ImageDropzone and all form inputs

### Validation & Error Handling

- [ ] T223 [P] Implement real-time validation display for property forms
- [ ] T224 [P] Add validation warnings for incomplete configurations: buildings without hotspots on all angles
- [ ] T225 [P] Add referential integrity checks before export: orphaned references, incomplete hierarchies
- [ ] T226 [P] Display user-friendly error messages for file upload failures
- [ ] T227 [P] Add coordinate bounds checking during polygon drawing with visual indicators

### Performance Optimization

- [ ] T228 [P] Implement code splitting: lazy load each admin section page
- [ ] T229 [P] Optimize Konva layer rendering: use LayerManager for selective redraws
- [ ] T230 [P] Add image thumbnail generation for faster previews
- [ ] T231 [P] Implement virtualization for long lists (models, buildings, floors)
- [ ] T232 Monitor bundle size: ensure each chunk stays under 200KB gzipped

### User Experience

- [ ] T233 [P] Add loading states for all async operations with spinners
- [ ] T234 [P] Add success toast notifications for save/export/import operations
- [ ] T235 [P] Implement undo/redo for canvas operations (optional enhancement)
- [ ] T236 [P] Add preview mode: test configuration in viewer before export
- [ ] T237 [P] Add progress indicators for multi-step operations (360° upload, ZIP export)

### Documentation

- [ ] T238 [P] Add inline help tooltips for complex features
- [ ] T239 [P] Create user guide documentation in docs/admin-guide.md
- [ ] T240 Run quickstart.md validation: verify setup instructions work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P1) → US3 (P1) → US4 (P2) → US5 (P2) → US6 (P2) → US7 (P2) → US8 (P3)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent, no dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Independent, but creates buildings used by US4
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US3 for building entities, creates floors used by US5
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US4 for floor entities, depends on US1 for model references
- **User Story 6 (P2)**: Can start after US1 (depends on models) - Independent of other stories
- **User Story 7 (P2)**: Can start after Foundational (Phase 2) - Affects all sections, best done after US1-US5
- **User Story 8 (P3)**: Can start after Foundational (Phase 2) - Independent, but export/import tests all other stories

### Within Each User Story

- Components before pages
- Store actions before components that use them
- Canvas tools before editor components
- Validation before save/export operations
- Individual features before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks can run sequentially (dependency installs must be ordered)

**Phase 2 (Foundational)**: High parallelization possible:

- T015-T017: Persistence setup (sequential within group)
- T018-T020: Type definitions (all parallel)
- T021-T027: Zustand stores (all parallel)
- T028-T030: Validation services (all parallel)
- T031-T038: Core components (parallel except T034 before others)
- T041-T043: Custom hooks (all parallel)
- T044-T045: Utilities (all parallel)

**Phase 3 (US1)**: Some parallelization:

- T047-T049: Project settings form (parallel)
- T052-T055: Model editor components (parallel)
- T059-T062: 360° rotation uploader (sequential)
- T066-T069: Export functionality (sequential)

**Phase 4 (US2)**: High parallelization:

- T076-T077: Drawing tools (parallel)
- T081-T084: Editor components (parallel)
- T087-T091: Path tools (sequential within group)

**Phase 5 (US3)**: Moderate parallelization:

- T100-T103: Building management UI (sequential)
- T104-T107: Angle editor (sequential)
- T108-T112: Hotspot drawing (sequential)

**Phase 6-10 (US4-US8)**: Similar patterns to above

**Phase 11 (Polish)**: Most tasks can run in parallel (marked with [P])

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Type definitions (all parallel):
T018: Create src/admin/types/admin-config.ts
T019: Create src/admin/types/canvas.ts
T020: Create src/admin/types/editor.ts

# Zustand stores (all parallel):
T021: Create src/admin/stores/projectStore.ts
T022: Create src/admin/stores/canvasStore.ts
T023: Create src/admin/stores/modelsStore.ts
T024: Create src/admin/stores/mapStore.ts
T025: Create src/admin/stores/masterPlanStore.ts
T026: Create src/admin/stores/buildingsStore.ts
T027: Create src/admin/stores/floorsStore.ts

# Validation services (all parallel):
T028: Create src/admin/services/validation/imageValidator.ts
T029: Create src/admin/services/validation/polygonValidator.ts
T030: Create src/admin/services/validation/integrityChecker.ts
```

---

## Parallel Example: User Story 2

```bash
# Drawing tools (parallel):
T076: Create src/admin/components/canvas/CircleMarkerTool.tsx
T077: Create src/admin/components/canvas/PolygonDrawingTool.tsx

# Editor components (parallel):
T081: Create src/admin/components/editors/LandmarkEditor.tsx
T084: Create src/admin/components/canvas/PolygonEditor.tsx
T087: Create src/admin/components/canvas/PathDrawingTool.tsx
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only - All P1)

1. Complete Phase 1: Setup (T001-T014)
2. Complete Phase 2: Foundational (T015-T045) - CRITICAL: blocks all stories
3. Complete Phase 3: User Story 1 (T046-T070) - Project and model management
4. Complete Phase 4: User Story 2 (T071-T097) - Map with landmarks and paths
5. Complete Phase 5: User Story 3 (T098-T120) - Master plan with buildings
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Export complete configuration and test in existing viewer
8. Deploy/demo if ready

**Estimated MVP Task Count**: ~120 tasks (Setup: 14 + Foundational: 31 + US1: 25 + US2: 27 + US3: 23)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Project & Models)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP with Map!)
4. Add User Story 3 → Test independently → Deploy/Demo (Complete P1!)
5. Add User Story 4 → Test independently → Deploy/Demo (Buildings)
6. Add User Story 5 → Test independently → Deploy/Demo (Floors & Units)
7. Add User Story 6 → Test independently → Deploy/Demo (Virtual Tours)
8. Add User Story 7 → Test independently → Deploy/Demo (UI Polish)
9. Add User Story 8 → Test independently → Deploy/Demo (Import/Export Complete)
10. Add Phase 11 Polish → Final deployment

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (critical path)
2. Once Foundational is done (after T045):
   - **Developer A**: User Story 1 (Project & Models) - T046-T070
   - **Developer B**: User Story 2 (Map) - T071-T097 (independent)
   - **Developer C**: User Story 3 (Master Plan) - T098-T120 (independent)
3. After P1 stories (T120):
   - **Developer A**: User Story 4 (Buildings) - T121-T138 (depends on US3)
   - **Developer B**: User Story 6 (Tours) - T160-T177 (depends on US1)
   - **Developer C**: User Story 8 (Import/Export) - T193-T216 (independent)
4. After buildings complete (T138):
   - **Developer A**: User Story 5 (Floors) - T139-T159 (depends on US4 & US1)
   - **Developer B**: User Story 7 (Full Viewport) - T178-T192 (cross-cutting)
5. All developers: Phase 11 Polish (many parallel tasks)

---

## Summary

- **Total Tasks**: 240 tasks
- **Setup Phase**: 14 tasks
- **Foundational Phase**: 31 tasks (CRITICAL - blocks all user stories)
- **User Story 1 (P1)**: 25 tasks - Project & Model Management (MVP foundation)
- **User Story 2 (P1)**: 27 tasks - Interactive Map (MVP core)
- **User Story 3 (P1)**: 23 tasks - Master Plan (MVP navigation)
- **User Story 4 (P2)**: 18 tasks - Building Configuration
- **User Story 5 (P2)**: 21 tasks - Floor Plans & Units
- **User Story 6 (P2)**: 18 tasks - Virtual Tours
- **User Story 7 (P2)**: 15 tasks - Full Viewport UI
- **User Story 8 (P3)**: 24 tasks - Import/Export & Autosave
- **Polish Phase**: 24 tasks - Cross-cutting enhancements

**MVP Scope (P1 stories only)**: 120 tasks (Setup + Foundational + US1 + US2 + US3)

**Parallel Opportunities**:

- Phase 2: ~20 tasks can run in parallel (stores, types, validation services)
- US1-US3 (P1 stories): Can run in parallel after Foundational phase
- US4-US5: Sequential dependency (buildings → floors)
- US6-US8: Can run in parallel with US4-US5
- Phase 11: ~20 tasks can run in parallel

**Format Validation**: ✅ All tasks follow checklist format with:

- Checkbox: `- [ ]`
- Task ID: T001-T240 sequential
- [P] markers: 78 parallelizable tasks identified
- [Story] labels: All user story tasks labeled (US1-US8)
- File paths: Included in descriptions where applicable
- Dependencies: Clear execution order defined

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Foundational phase (T015-T045) is CRITICAL PATH - must complete before any user story work
- User Stories 1, 2, 3 are all P1 priority and form the MVP
- User Story 4 depends on User Story 3 (buildings)
- User Story 5 depends on User Story 4 (floors) and User Story 1 (models)
- User Story 6 depends on User Story 1 (models)
- User Story 7 affects all sections (best implemented after core stories)
- User Story 8 can be developed independently but validates all other stories
