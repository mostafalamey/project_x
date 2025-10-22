# Tasks: Real Estate Complex Interactive Viewer

Feature: 001-interactive-complex-viewer
Spec: specs/001-interactive-complex-viewer/spec.md
Plan: specs/001-interactive-complex-viewer/plan.md

Notes:

- Organize by user stories to enable independent, incremental delivery.
- Use hash-based routing and static JSON under `/public/data` per the plan and constitution.
- Tests are optional; include only independent test criteria per story.

---

## Phase 1 — Setup

- [x] T001 Create package manifest at repository root: /package.json
- [x] T002 Add Vite config with hash routing base handling: /vite.config.ts
- [x] T003 Add TypeScript config: /tsconfig.json
- [x] T004 Add Tailwind config: /tailwind.config.js
- [x] T005 Add PostCSS config: /postcss.config.js
- [x] T006 Create application HTML entry: /index.html
- [x] T007 Create app bootstrap: /src/main.tsx
- [x] T008 Create root app component: /src/App.tsx
- [x] T009 Configure hash router with top-level routes: /src/routes/index.tsx
- [x] T010 Initialize Tailwind stylesheet and import: /src/styles/index.css
- [x] T011 Add ESLint configuration for TS/React: /.eslintrc.cjs
- [x] T012 Add Git ignore file: /.gitignore

## Phase 2 — Foundational

- [x] T013 [P] Create landmarks data stub matching schema: /public/data/landmarks.json
- [x] T014 [P] Create master plan buildings overlay JSON stub: /public/data/masterplan/buildings.json
- [x] T015 [P] Create one floor hotspots JSON stub (e.g., f3): /public/data/buildings/b11/floors/f3.json
- [x] T016 [P] Create one unit tour JSON stub referencing scenes: /public/data/tours/unit-b12-32/tour.json
- [x] T017 [P] Create units listing JSON stub (array of Unit): /public/data/units.json
- [x] T018 Define TypeScript types for entities (Map, Landmark, MasterPlan, Building, Floor, Unit, Tour): /src/data/types.ts
- [x] T019 Setup dev-time JSON schema validation scaffolding (AJV integration stub): /src/data/schemas/index.ts
- [x] T020 Implement data loaders for JSON files (landmarks, masterplan, floor, units, tours): /src/data/loaders.ts
- [x] T021 Create Map view page placeholder with layout: /src/pages/MapView.tsx
- [x] T022 [P] Create Master Plan view page placeholder with layout: /src/pages/MasterPlanView.tsx
- [x] T023 [P] Create Building view page placeholder with layout: /src/pages/BuildingView.tsx
- [x] T024 [P] Create Floor Plan view page placeholder with layout: /src/pages/FloorPlanView.tsx
- [x] T025 [P] Create Unit viewer page placeholder (details panel): /src/pages/UnitViewer.tsx
- [x] T026 [P] Create Tour viewer page placeholder (react-photo-sphere-viewer mount): /src/pages/TourViewer.tsx
- [x] T027 [P] Create Search panel component placeholder: /src/components/SearchPanel.tsx
- [x] T028 Wire initial routes for Map → MasterPlan → Building → Floor → Unit → Tour: /src/routes/index.tsx
- [x] T029 Add back navigation UI component placeholder: /src/components/BackNav.tsx

---

## Phase 3 — User Story 1 (P1): Navigate to Unit Tour

Story goal: A visitor can start at map, drill down to a unit, and open its 360° tour using only static assets.
Independent test criteria: From landing, reach a unit’s tour (default scene) with working hotspot navigation and deep link restore.

- [x] T030 [US1] Implement MapView with map image and complex hotspot navigation: /src/pages/MapView.tsx
- [x] T031 [P] [US1] Load landmarks from JSON and animate path to complex or navigate directly: /src/pages/MapView.tsx
- [x] T032 [US1] Implement basic MasterPlanView to show angle image and clickable building area: /src/pages/MasterPlanView.tsx
- [x] T033 [US1] Implement BuildingView elevation image and clickable floors: /src/pages/BuildingView.tsx
- [x] T034 [US1] Implement FloorPlanView rendering unit hotspots with tooltip details: /src/pages/FloorPlanView.tsx
- [x] T035 [US1] Implement UnitViewer details panel/modal with "View Virtual Tour": /src/pages/UnitViewer.tsx (REMOVED - Direct navigation to tour)
- [x] T036 [US1] Implement TourViewer using react-photo-sphere-viewer with fade transitions and adjacent scene preload: /src/pages/TourViewer.tsx
- [x] T037 [US1] Implement deep link parse/restore for building/floor/unit state (hash routes): /src/routes/index.tsx

---

## Phase 4 — User Story 2 (P2): Search & Filter Units

Story goal: A visitor can filter units by criteria and navigate to a selected unit's details.
Independent test criteria: With `/public/data/units.json`, filters narrow results and selection navigates correctly.

- [x] T038 [US2] Implement SearchPanel with area, bedrooms, bathrooms, floor, and availability filters: /src/components/SearchPanel.tsx
- [x] T039 [P] [US2] Load and filter units dataset; expose filtered results to views: /src/data/loaders.ts
- [x] T040 [P] [US2] Render filtered units list and enable selection-to-navigation: /src/components/UnitList.tsx
- [x] T041 [US2] Handle navigation from a selected unit to its detail state via deep link: /src/pages/UnitViewer.tsx (Integrated into MasterPlanView with direct floor navigation)

---

## Phase 5 — User Story 3 (P3): Master Plan Exploration

Story goal: Cycle through 4 angles with smooth 25-frame transitions; show clickable building overlays with hover summaries.
Independent test criteria: Cycle angles and transitions, hover summaries visible, clicking a building navigates to elevation view.

- [x] T042 [US3] Add 4-angle cycling UI and image rendering: /src/pages/MasterPlanView.tsx
- [x] T043 [P] [US3] Implement 25-frame inter-angle transition preloading and animation: /src/pages/MasterPlanView.tsx
- [x] T044 [P] [US3] Render building hotspots from `masterplan/buildings.json` with hover summary: /src/pages/MasterPlanView.tsx
- [x] T045 [US3] Navigate to BuildingView on building click and update deep link: /src/pages/MasterPlanView.tsx

---

## Phase 6 — User Story 4 (P3): Street View

Story goal: Explore outdoor panorama points connected by simple hotspots using the same viewer.
Independent test criteria: Load outdoor scenes from JSON; hotspot navigation works with responsive loading indicator.

- [x] T046 [US4] Add outdoor tour JSON (street view) with scenes and links: /public/data/tours/street-view/tour.json
- [x] T047 [P] [US4] Add Street View entry control (button/menu) and route: /src/pages/MapView.tsx
- [x] T048 [US4] Reuse TourViewer for Street View tour loading and navigation: /src/pages/TourViewer.tsx

---

## Final Phase — Polish & Cross-Cutting

- [x] T049 Add keyboard navigation and visible focus styles for hotspots: /src/styles/index.css
- [x] T050 Add descriptive alt text and aria-labels on interactive imagery: /src/pages/MasterPlanView.tsx
- [x] T051 Add pano loading indicator and non-blocking preload handling: /src/pages/TourViewer.tsx
- [x] T052 Ensure hash deep links for all states; add `404.html` fallback (optional): /public/404.html
- [x] T053 Add project README with data placement and configuration notes: /README.md

---

## Dependencies (Story Order)

1. US1 (P1) → 2. US2 (P2) → 3. US3 (P3) → 4. US4 (P3)

- US1 provides navigation scaffolding consumed by others
- US2 depends on deep link/selection wiring from US1
- US3 enhances Master Plan but can start in parallel once foundational files exist
- US4 depends on TourViewer from US1

## Parallel Execution Examples

- T021–T027 (creating page/component placeholders) can be done in parallel
- T013–T017 (data stubs) can be prepared in parallel
- T042–T044 (US3 features) can be developed in parallel after T032 is in place
- T038–T040 (US2) can be parallelized across component, data, and UI pieces

## Implementation Strategy

- MVP: Deliver US1 end-to-end first (map → master plan → building → floor → unit → tour) using static JSON and sample images
- Incrementally add US2 filters, then US3 master plan transitions/overlays, and US4 street view
- Keep performance and a11y in scope throughout; finalize in the Polish phase
