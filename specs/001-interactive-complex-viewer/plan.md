# Implementation Plan: Real Estate Complex Interactive Viewer

**Branch**: `001-interactive-complex-viewer` | **Date**: 2025-10-22 | **Spec**: D:/websites/Project_X/project_x/specs/001-interactive-complex-viewer/spec.md
**Input**: Feature specification from `/specs/001-interactive-complex-viewer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Build a reusable static web application to explore a single real estate complex:
map → master plan (exactly 4 camera angles with 25‑image transitions between
angles) → building → floor → unit → 360° unit tour, with simple Street View
hotspots. All content is static (images/JSON). Hash-based routing provides
shareable deep links. Accessibility and basic performance targets apply.

Contracts produced (see contracts/):

- unit.schema.json (units listing with availability and tourPath)
- building.schema.json (building with floors and unit hotspots)
- floor.schema.json (per-floor hotspots file, e.g., `floors/f3.json`)
- masterplan.schema.json (exactly 4 angles and 25‑frame inter‑angle sequences; building overlays)
- landmarks.schema.json (array for `landmarks.json`)
- tour.schema.json (tour.json with scenes and optional startSceneId)

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript/TypeScript (browser); Node LTS for tooling  
**Primary Dependencies**: React, Vite, react-router-dom (hash routing), TailwindCSS, Framer Motion, react-photo-sphere-viewer  
**Storage**: N/A (static JSON files under `/public/data`)  
**Testing**: Optional per constitution; include linting, formatting, link checking (e.g., html-validate)  
**Target Platform**: Static hosts (GitHub Pages, Netlify, Vercel static)  
**Project Type**: web (static site)  
**Performance Goals**: Initial interactive view ≤ 2s; largest JS bundle ≤ 200 KB gzipped; hotspot transitions init ≤ 300 ms, complete ≤ 1 s  
**Constraints**: Static-only, no secrets, deterministic `dist/` artifact with `index.html` and `404.html` (or hash routing), accessibility (keyboard/focus/alt/contrast)  
**Scale/Scope**: Single complex; up to ~1,000 units; exactly 4 master plan angles; inter‑angle transitions use 25‑image sequences; multiple pano scenes per unit

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Gates derived from `.specify/memory/constitution.md` (v1.0.0):

- P1 Static‑Only Delivery: No server-side code/functions; static assets only → PASS (static React app)
- P2 Zero Secrets & Write‑Safe: No secrets in client; external access anonymous/read‑only → PASS (local JSON only)
- P3 Deterministic Build Artifact: One build command outputs `dist/` with relative assets and `index.html`; include `404.html` or use hash routing → PASS (Vite build + hash routing)
- P4 Accessibility & Basic Performance: a11y baseline and perf budgets → PASS (targets set in Technical Context)

Re-check will occur after Phase 1 design; any violations will block planning.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
public/                         # Static assets copied as-is (images, JSON)
  data/
    map.png
    landmarks.json
    masterplan/
      iso1.png
      iso2.png
      iso3.png
      iso4.png
      transitions/              # 25-frame image sequences between angles
        1-2/
          frame-001.png
          ...
          frame-025.png
        2-3/
          frame-001.png
          ...
          frame-025.png
        3-4/
          frame-001.png
          ...
          frame-025.png
        4-1/
          frame-001.png
          ...
          frame-025.png
      buildings.json
    buildings/
      b11/
        elevation.png
        floors/
          f3.png
          f3.json
    tours/
      unit-b12-32/
        living-room.jpg
        kitchen.jpg
        tour.json
src/
  components/
    MapView.tsx
    MasterPlanView.tsx
    BuildingView.tsx
    FloorPlanView.tsx
    UnitViewer.tsx
    TourViewer.tsx
    SearchPanel.tsx
  routes/
  styles/
  data/                        # Type defs and loaders for JSON in /public/data
dist/                           # Build output (required)
```

**Structure Decision**: Static web app structure with `public/`, `src/`, and `dist/` per constitution. Routing via hash to support deep links on static hosts.

## Complexity Tracking

Note: Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| (none)    | —          | —                                    |
