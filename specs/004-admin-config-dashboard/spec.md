# Feature Specification: Admin Configuration Dashboard

**Feature Branch**: `004-admin-config-dashboard`  
**Created**: October 24, 2025  
**Status**: Draft  
**Input**: User description: "I want to build an Admin Dashboard for configuring this real-estate complex viewer. This app allows an admin to visually define a project's interactive layers — from the site map down to each model's 360° tour. This Admin App is a visual project editor that updates the JSON configuration files + image assets. The structure represents a full hierarchy of a real estate complex: Project Settings → Models → Map → Master Plan → Building → Floor → Unit. At every visual stage (Map, Master Plan, Building, Floor), the image fills the entire viewport (100vw × 100vh), and all tools and UI elements are overlays. The app should have a sidebar navigation that contains ⚙️ Project Settings 🏗️ Models 📍 Map 🏙️ Master Plan 🏢 Building 🏬 Floor Where I can edit each section of the website. The app should have a polygonal SVG drawing tool for all views, The app should have a virtual tour editor, where the user can add scenes and hotspots links to next scenes, using react-photo-sphere-viewer"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Project Configuration & Model Management (Priority: P1)

An administrator needs to configure the basic project settings and define the available apartment models for the real estate complex. This includes setting project metadata, uploading model images, defining model attributes like bedrooms, bathrooms, and area, and adding 360° rotation image sequences for interactive model viewing.

**Why this priority**: This is the foundation of the entire system. Without models and basic project settings, no other configuration can exist. This delivers immediate value by allowing admins to catalog available apartment types with rich interactive content.

**Independent Test**: Can be fully tested by creating a new project, adding 3 different apartment models with images and attributes, uploading 360° rotation image sequences for at least one model, then verifying the configuration exports correctly to JSON format.

**Acceptance Scenarios**:

1. **Given** the admin opens the dashboard, **When** they navigate to Project Settings, **Then** they can edit project name, developer information, contact details, and general metadata
2. **Given** the admin is in the Models section, **When** they click "Add Model", **Then** they can upload a model image, enter details (title, description, area, bedrooms, bathrooms), and save the model
3. **Given** a model is created, **When** the admin selects "Add 360° Rotation", **Then** they can upload a sequence of rotation images and specify frame count and filename pattern
4. **Given** the admin has uploaded rotation images, **When** they preview the model, **Then** the system displays the 360° rotation by cycling through the image sequence
5. **Given** the admin has added multiple models, **When** they reorder models using drag-and-drop, **Then** the display order updates in the configuration
6. **Given** the admin has configured models, **When** they click "Export Configuration", **Then** the system generates a valid `models.json` file with all model data including rotation image references
7. **Given** the admin uploads a model image, **When** the image file is selected, **Then** the system validates the image format (JPEG/PNG only) and displays a preview

---

### User Story 2 - Interactive Map & Landmark Definition (Priority: P1)

An administrator needs to upload a site map image and define two types of interactive landmarks: Points of Interest (POI) as simple circular markers with coordinates, and the Main Complex as a polygonal shape. The admin must also draw SVG path lines connecting the Main Complex to each POI to show access routes or distances.

**Why this priority**: The map provides critical context for potential buyers about location and surroundings. This is a core feature that helps differentiate properties by showcasing neighborhood advantages and spatial relationships.

**Independent Test**: Can be fully tested by uploading a map image, drawing the Main Complex polygon, adding 5 POI circular markers, drawing connecting paths from the complex to each POI, assigning properties to each landmark (name, description, distance), and verifying the exported `landmarks.json` file.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Map section, **When** they upload a site map image, **Then** the image fills the viewport and serves as the drawing canvas
2. **Given** a map image is loaded, **When** the admin selects "Add Main Complex" and uses the polygon tool, **Then** they can draw a closed polygon shape representing the complex boundary
3. **Given** the Main Complex is defined, **When** the admin selects "Add POI" and clicks a location, **Then** a circular marker appears at that coordinate
4. **Given** a POI is created, **When** the admin clicks on it, **Then** a properties panel appears where they can enter landmark name, description, type (poi), distance, and time
5. **Given** the Main Complex and POIs exist, **When** the admin selects "Draw Path" and clicks the complex then a POI, **Then** an SVG path line is drawn connecting them
6. **Given** a path is drawn, **When** the admin clicks on the path, **Then** they can edit the path by dragging control points or deleting it
7. **Given** the Main Complex polygon is drawn, **When** the admin clicks on it, **Then** they can edit vertices by dragging, modify its properties (name, description), or delete it
8. **Given** multiple landmarks and paths exist, **When** the admin saves, **Then** the system exports a `landmarks.json` file with polygon coordinates for the complex, point coordinates for POIs, path data, and metadata
9. **Given** the admin is drawing any element, **When** they press Escape or click "Cancel", **Then** the current drawing operation is cancelled

---

### User Story 3 - Master Plan Building Definition & Hotspot Configuration (Priority: P1)

An administrator needs to configure the master plan view by first creating building entities, then uploading angle images and drawing polygonal SVG hotspots for each building across all viewing angles. The admin must also set up transitions between viewing angles. Buildings created here will be available for editing in the Building section.

**Why this priority**: The master plan is the primary navigation mechanism for exploring the complex. Without this, users cannot navigate between buildings or understand the site layout from different perspectives. This also establishes the building entities that drive the rest of the hierarchy.

**Independent Test**: Can be fully tested by creating 3 building entities (with names/IDs), uploading 2 master plan angle images, drawing polygonal hotspots for each building on both angles, configuring the transition sequence between angles, then switching to the Building tab to verify all created buildings appear for editing, and finally verifying the exported `masterplan/buildings.json` file.

**Acceptance Scenarios**:

1. **Given** the admin navigates to Master Plan, **When** they click "Add Building", **Then** they can create a building entity with name and ID
2. **Given** buildings are defined, **When** the admin adds a new angle, **Then** they can upload an angle image and it displays full-viewport
3. **Given** an angle image is displayed, **When** the admin selects "Draw Building Hotspot" and chooses a building from the list, **Then** they can draw a polygon representing that building's clickable area on this angle
4. **Given** a building has hotspots on one angle, **When** the admin switches to a different angle, **Then** they must draw new polygonal hotspots for the same building on that angle to maintain consistency
5. **Given** multiple buildings exist, **When** the admin draws hotspots for each building across all angles, **Then** each building has defined polygonal boundaries on every viewing angle
6. **Given** multiple angles exist, **When** the admin configures transitions, **Then** they can upload a sequence of transition images between consecutive angles and specify frame count
7. **Given** hotspots are defined on an angle, **When** the admin tests the configuration, **Then** they can preview the master plan navigation including angle rotation and building selection
8. **Given** buildings are created in Master Plan, **When** the admin switches to the Building tab, **Then** all buildings created in the master plan appear as selectable items for detailed editing
9. **Given** the admin is working on an angle, **When** they switch to a different angle, **Then** the viewport updates to show that angle's image and its associated hotspots

---

### User Story 4 - Building Image & Floor Hotspot Configuration (Priority: P2)

An administrator needs to select a building (created in Master Plan), upload a building elevation/exterior image, and add floors by drawing polygonal SVG hotspots on the building image that represent each floor's location. These floors will then be available for detailed editing in the Floor section.

**Why this priority**: Building-level configuration establishes the floor structure that enables unit-level detail. Users must first reach a building before viewing its floors and units.

**Independent Test**: Can be fully tested by selecting a building from the Master Plan list, uploading a building exterior image, drawing 3-5 polygonal floor hotspots on the image (representing ground floor, first floor, etc.), then switching to the Floor tab to verify all created floors appear for editing, and verifying the exported building JSON configuration.

**Acceptance Scenarios**:

1. **Given** the admin navigates to Building section, **When** they see the building list, **Then** all buildings created in the Master Plan section are displayed as selectable items
2. **Given** the admin selects a building from the list, **When** they upload a building image (exterior/elevation view), **Then** the image fills the viewport as the editing canvas
3. **Given** a building image is displayed, **When** the admin clicks "Add Floor", **Then** they can create a floor entity with name/number (e.g., "Ground Floor", "Floor 1")
4. **Given** a floor is created, **When** the admin selects "Draw Floor Hotspot" and chooses the floor, **Then** they can draw a polygonal SVG shape on the building image representing that floor's clickable area
5. **Given** multiple floors are added, **When** the admin draws hotspot polygons for each floor on the building image, **Then** each floor has a defined polygonal boundary indicating its location on the building exterior
6. **Given** floors are created in the Building view, **When** the admin switches to the Floor tab, **Then** all floors created for that building appear as selectable items for detailed floor plan editing
7. **Given** floor hotspots are defined, **When** the admin tests the configuration, **Then** they can preview clicking on floor polygons to navigate to floor plans
8. **Given** the admin saves the building configuration, **When** the system exports, **Then** it generates a building JSON file with floor entities and their polygonal hotspot coordinates on the building image

---

### User Story 5 - Floor Plan Image & Unit Hotspot Mapping (Priority: P2)

An administrator needs to select a floor (created in Building view), upload a floor plan image, and draw unit boundaries as polygonal SVG hotspots, linking each unit polygon to an apartment model. This allows users to select specific units and see their details.

**Why this priority**: Unit-level detail is essential for sales but builds on the building and floor navigation hierarchy. Users must first reach a building, then a floor, before viewing individual units.

**Independent Test**: Can be fully tested by selecting a floor from the Building section list, uploading a floor plan image, drawing 5-10 unit polygonal hotspots on the floor plan, linking each unit to a model type, assigning unit numbers and availability status, and verifying the exported floor JSON configuration.

**Acceptance Scenarios**:

1. **Given** the admin navigates to Floor section, **When** they see the floor list, **Then** all floors created in the Building section are displayed as selectable items organized by building
2. **Given** the admin selects a floor from the list, **When** they upload a floor plan image, **Then** the image fills the viewport as the editing canvas
3. **Given** a floor plan is displayed, **When** the admin uses the polygon tool to draw unit boundaries, **Then** each polygon represents a selectable unit
4. **Given** a unit polygon is drawn, **When** the admin clicks it, **Then** they can assign a model type (from the Models section), unit number, availability status, and pricing information
5. **Given** a unit is linked to a model, **When** the properties panel displays, **Then** it shows inherited model information (bedrooms, bathrooms, area) for reference
6. **Given** multiple units are defined on a floor, **When** the admin saves, **Then** the system generates a floor JSON file with all unit polygons, their associated model references, and unit-specific metadata
7. **Given** the admin edits unit properties, **When** the configuration is exported, **Then** each unit maintains its link to the model while preserving unique unit identifiers and status

---

### User Story 6 - 360° Virtual Tour Scene Editor (Priority: P2)

An administrator needs to create and edit virtual tours by uploading panoramic images, creating scenes, and adding hotspots that link scenes together. This provides immersive property exploration.

**Why this priority**: Virtual tours significantly enhance user engagement but are supplementary to the core navigation. Some models may not have tours initially.

**Independent Test**: Can be fully tested by creating a tour with 4-5 panoramic scenes, adding navigation hotspots between scenes, configuring hotspot positions and tooltips, and verifying the exported tour JSON file plays correctly in the viewer.

**Acceptance Scenarios**:

1. **Given** the admin is editing a model, **When** they navigate to the Virtual Tour section, **Then** they can create a new tour for that model
2. **Given** a tour is created, **When** the admin adds a scene, **Then** they can upload a 360° panoramic image (equirectangular format)
3. **Given** a panoramic scene is loaded in the viewer, **When** the admin clicks on a location in the panorama, **Then** they can add a hotspot at that position
4. **Given** a hotspot is created, **When** the admin configures it, **Then** they can set the target scene it links to, tooltip text, and hotspot icon type
5. **Given** multiple scenes with hotspots exist, **When** the admin tests the tour, **Then** they can navigate through the tour by clicking hotspots to verify the flow
6. **Given** a scene is the tour entry point, **When** the admin marks it as the starting scene, **Then** the tour configuration saves this as the default initial view
7. **Given** the admin is positioning a hotspot, **When** they drag the hotspot marker in the panorama, **Then** the hotspot position updates in real-time

---

### User Story 7 - Full-Screen Canvas with Overlay UI (Priority: P2)

An administrator working on any visual section (Map, Master Plan, Floor Plans) needs all editing tools and panels to appear as overlays so the background image always fills the entire viewport without scrolling or cropping.

**Why this priority**: This ensures a professional editing experience and WYSIWYG (what you see is what you get) configuration, but the overlay pattern can be implemented gradually per section.

**Independent Test**: Can be fully tested by loading each section type (Map, Master Plan, Floor Plan) and verifying that the background image fills 100vw × 100vh, all toolbars are positioned as overlays, and no scrollbars appear during editing.

**Acceptance Scenarios**:

1. **Given** the admin opens any visual editing section, **When** the image loads, **Then** it scales to fill the viewport (100vw × 100vh) maintaining aspect ratio
2. **Given** an image fills the viewport, **When** editing tools are displayed, **Then** they appear as floating overlay panels that don't obscure the image unnecessarily
3. **Given** the admin is drawing polygons, **When** a properties panel opens, **Then** it appears as a modal or side panel overlay without changing the canvas size
4. **Given** the viewport is resized, **When** the browser window dimensions change, **Then** the image rescales and overlays reposition appropriately
5. **Given** overlay panels are open, **When** the admin clicks outside them, **Then** they can be dismissed or minimized to maximize canvas visibility

---

### User Story 8 - Configuration Import/Export & Autosave (Priority: P3)

An administrator needs the system to automatically save their work periodically and provide the ability to export the entire project configuration as a downloadable package (JSON files + images) or import an existing project.

**Why this priority**: This prevents data loss and enables project portability, but is a supporting feature that doesn't block core editing functionality.

**Independent Test**: Can be fully tested by making changes across different sections, waiting for autosave confirmation, then refreshing the browser to verify changes persist. Also test exporting the full project and importing it into a fresh instance.

**Acceptance Scenarios**:

1. **Given** the admin makes any configuration change, **When** 30 seconds of inactivity pass, **Then** the system automatically saves all changes to browser storage
2. **Given** autosave is active, **When** changes are saved, **Then** a visual indicator shows "Saved at [timestamp]" or "Saving..." during the operation
3. **Given** the admin has configured a complete project, **When** they click "Export Project", **Then** the system downloads a ZIP file containing all JSON configuration files and references to image assets
4. **Given** the admin has an exported project package, **When** they click "Import Project" and select the ZIP file, **Then** the system loads all configuration data and prompts for any missing image files
5. **Given** the browser storage quota is reached, **When** the system attempts autosave, **Then** it displays a warning and prompts the admin to export or clear old data
6. **Given** the admin reloads the page, **When** unsaved changes exist in autosave storage, **Then** a prompt asks whether to restore the unsaved work or discard it

---

### Edge Cases

- What happens when an admin uploads an invalid image format (e.g., GIF, WebP, SVG)? The system should validate file type and display an error message refusing non-JPEG/PNG images.
- What happens when an admin uploads 360° rotation images with inconsistent dimensions? The system should validate that all rotation frames have the same dimensions and warn if mismatches are detected.
- What happens when an admin tries to draw a building hotspot in Master Plan before creating any building entities? The system should prompt the admin to create buildings first or disable the hotspot drawing tool.
- What happens when an admin deletes a building from Master Plan that already has floors and units configured? The system should display a warning listing all affected floors and units, and either prevent deletion or cascade delete all child entities.
- What happens when an admin tries to access the Building tab before creating any buildings in Master Plan? The system should display a message indicating no buildings exist and prompt navigation to Master Plan.
- What happens when an admin tries to access the Floor tab before creating any floors in Building view? The system should display a message indicating no floors exist and prompt navigation to Building section.
- What happens when polygon coordinates are drawn outside the visible image bounds? The system should either constrain coordinates to image dimensions or warn about out-of-bounds coordinates.
- What happens when an admin deletes a model that is referenced by existing units in floor plans? The system should display a confirmation warning listing all affected units and either prevent deletion or automatically unlink them.
- What happens when the browser window is too small to display the full-viewport image effectively? The system should show a minimum viewport warning or scale the image with scrollbars as a fallback.
- What happens when an admin attempts to draw a polygon with fewer than 3 points? The system should prevent saving and display a validation message requiring at least 3 vertices.
- What happens when two hotspot polygons overlap on the same image (e.g., two building hotspots on one angle)? The system should allow overlaps but provide a z-index control or layer ordering to manage click priority.
- What happens when an admin draws an SVG path from a POI to the Main Complex but later deletes that POI? The system should automatically delete the connected path or display a warning.
- What happens when an admin creates a building in Master Plan but doesn't draw hotspots for it on all angles? The system should warn that the building is incomplete and may not be accessible from certain viewing angles.
- What happens when transition frame sequences are missing files or have incorrect frame counts? The system should validate on upload and display errors for missing frames.
- What happens when the admin navigates away from an unsaved section? The system should prompt for confirmation before discarding changes or automatically trigger a save.
- What happens when imported JSON configuration files have schema validation errors? The system should display detailed error messages identifying which fields are invalid or missing.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a persistent sidebar navigation with sections for Project Settings, Models, Map, Master Plan, Building, and Floor
- **FR-002**: System MUST allow administrators to create, edit, and delete apartment models with properties including title, description, area (m²), bedrooms, bathrooms, and image
- **FR-003**: System MUST support uploading 360° rotation image sequences for models with frame count and filename pattern specification
- **FR-004**: System MUST support uploading and displaying full-viewport background images (JPEG/PNG only) for Map, Master Plan angles, Building exterior views, and Floor Plans
- **FR-005**: System MUST provide two types of landmark drawing tools on the Map: circular POI markers (point coordinates) and polygonal Main Complex boundary
- **FR-006**: System MUST allow administrators to draw SVG path lines connecting the Main Complex to each POI on the map
- **FR-007**: System MUST provide a polygonal drawing tool that allows administrators to create closed polygon shapes by clicking points on canvas images
- **FR-008**: System MUST allow editing of polygon vertices by dragging, deleting polygons, editing paths, and modifying element properties
- **FR-009**: System MUST enforce hierarchical workflow: buildings created in Master Plan appear in Building section, floors created in Building view appear in Floor section
- **FR-010**: System MUST allow administrators to create building entities with names/IDs in the Master Plan section before drawing hotspots
- **FR-011**: System MUST require administrators to draw polygonal hotspots for each building across all master plan viewing angles
- **FR-012**: System MUST support uploading sequential transition image frames between master plan angles with configurable frame count
- **FR-013**: System MUST allow administrators to upload building exterior images and draw polygonal floor hotspots representing floor locations on the building
- **FR-014**: System MUST allow administrators to upload floor plan images and draw unit boundary polygons linked to model entities
- **FR-015**: System MUST link floor plan unit polygons to model entities and display inherited model properties (bedrooms, bathrooms, area)
- **FR-016**: System MUST integrate a 360° panorama viewer for creating virtual tour scenes with clickable navigation hotspots
- **FR-017**: System MUST allow administrators to position hotspots on panoramic scenes and link them to other scenes with tooltip text
- **FR-018**: System MUST render all editing tools, property panels, and controls as overlay elements that do not affect the full-viewport canvas size
- **FR-019**: System MUST export configuration data as valid JSON files matching the existing schema structures (models.json, landmarks.json, masterplan/buildings.json, building floor files, tour files)
- **FR-020**: System MUST automatically save configuration changes to browser local storage every 30 seconds of inactivity
- **FR-021**: System MUST provide manual export functionality to download the complete project configuration as a structured file package
- **FR-022**: System MUST validate uploaded images for format (JPEG/PNG only), reasonable file size limits (under 10MB per image), and consistent dimensions for rotation sequences
- **FR-023**: System MUST validate polygon data ensuring minimum 3 vertices and coordinates within image bounds
- **FR-024**: System MUST provide confirmation dialogs when deleting entities that are referenced by other configuration elements or have child entities
- **FR-025**: System MUST support importing previously exported project configurations, validating JSON schema compliance before loading
- **FR-026**: System MUST maintain referential integrity by cascading deletions or preventing deletion of entities with dependencies
- **FR-027**: System MUST allow administrators to reorder models, angles, floors, and tour scenes using drag-and-drop interactions
- **FR-028**: System MUST provide visual feedback for all drawing operations including cursor changes, temporary guides, and real-time polygon/path preview
- **FR-029**: System MUST persist unsaved changes across page reloads using autosave and prompt for restoration on next session
- **FR-030**: System MUST support keyboard shortcuts for common operations (Escape to cancel drawing, Delete key to remove selected polygon, Ctrl+S to save)
- **FR-031**: System MUST display real-time validation errors for invalid property values (e.g., negative area, invalid coordinates, incomplete hotspot coverage)
- **FR-032**: System MUST allow administrators to test/preview the configuration in the viewer mode before exporting
- **FR-033**: System MUST automatically delete SVG paths when their connected POI landmarks are deleted from the map
- **FR-034**: System MUST warn administrators when buildings are created without hotspots on all angles, or when the hierarchical configuration is incomplete

### Static web app constraints (if this project uses the static constitution)

- No backend or serverless functions; all functionality must run in the browser
- Do not embed secrets or API keys in client code; only anonymous, read‑only APIs allowed
- Build MUST output a host‑agnostic `dist/` (or `build/`) with `index.html` at root
- Routing MUST work statically (hash routing or 404.html fallback for deep links)
- Configuration persistence will use browser localStorage/IndexedDB; export generates downloadable files

### Key Entities _(include if feature involves data)_

- **Project**: Represents the overall real estate complex configuration including name, developer info, branding, and metadata
- **Model**: Apartment type/floor plan template with attributes (title, description, area, bedrooms, bathrooms, images, rotation frames, tour reference)
- **Landmark**: Point of interest on the site map, supporting two types: POI (circular marker with point coordinates and metadata: name, description, type, distance, time) and Main Complex (polygonal boundary with metadata)
- **Path**: SVG path line connecting the Main Complex to a POI landmark, with visual styling and editable control points
- **Angle**: Master plan viewing angle containing a background image, building hotspots (polygons for each defined building), and transition sequences to adjacent angles
- **Building**: Real estate building entity with identifier, name, created in Master Plan section, containing exterior image and collection of floor hotspots and configurations
- **Floor**: Individual floor within a building, first defined as a hotspot polygon on the building exterior image, then detailed with floor plan image and unit polygons
- **Unit**: Specific apartment unit defined by polygon boundaries on a floor plan, linked to a Model, with unit number, availability, and pricing
- **Tour**: Virtual 360° tour consisting of scenes (panoramic images) and navigation hotspots linking scenes
- **Scene**: Individual panoramic image within a tour with hotspots defining navigation points
- **Hotspot**: Interactive point on a panorama or image that links to another scene or entity, with position coordinates and tooltip

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Administrators can configure a complete real estate project (5+ models with 360° rotations, site map with main complex and 10+ POIs with connecting paths, master plan with 3+ angles and building hotspots, 2+ buildings with floors and units) in under 3 hours
- **SC-002**: Polygon and path drawing operations (creating, editing, deleting) complete with visible feedback in under 500ms for polygons with up to 20 vertices
- **SC-003**: The system successfully imports and validates exported configuration files with 100% schema accuracy (no data loss on export/import cycle)
- **SC-004**: Autosave operations complete within 2 seconds without blocking user interactions or causing UI lag
- **SC-005**: Administrators can create a 5-scene virtual tour with navigation hotspots in under 15 minutes per model
- **SC-006**: Image uploads and viewport rendering complete in under 3 seconds for images up to 10MB
- **SC-007**: 95% of administrators successfully create their first interactive map with main complex, POIs, and connecting paths without external documentation or support
- **SC-008**: The configuration export generates files that are immediately usable by the existing viewer application without manual JSON editing
- **SC-009**: All visual editing sections maintain full-viewport image display (100vw × 100vh) across desktop browsers at viewport sizes 1024px × 768px and larger
- **SC-010**: The system detects and prevents 100% of critical referential integrity errors (deleting referenced models, navigating to non-existent child sections, incomplete building hotspot coverage) before configuration export
- **SC-011**: The hierarchical workflow (Master Plan → Building → Floor) is intuitive enough that 90% of administrators correctly follow the entity creation sequence on their first attempt
- **SC-012**: Administrators can upload and configure a 60-frame 360° model rotation in under 5 minutes including preview validation
