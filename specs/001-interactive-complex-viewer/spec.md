# Feature Specification: Real Estate Complex Interactive Viewer

**Feature Branch**: `001-interactive-complex-viewer`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description summarised: "Interactive viewer for a single complex with navigation from map → master plan → building → floor → unit → 360° tour using static images and JSON data. Includes search/filter and optional street view mode."

## Clarifications

### Session 2025-10-21

- Q: Must users be able to share a link that opens the exact building/floor/unit state? → A: Yes, shareable deep links required

### Session 2025-10-22

- Q: What unit availability statuses must be supported? → A: Available, Reserved, Sold
- Q: Include Street View Mode in the initial release? → A: Simple 360 pano hot spots

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Navigate to Unit Tour (Priority: P1)

A visitor lands on the site, explores the map and master plan, drills into a building and floor, selects a unit, views details, and opens a 360° virtual tour. All content is loaded from static assets and JSON.

**Why this priority**: Core value of the site—helps users understand a specific unit and its spaces end-to-end.

**Independent Test**: Using local static JSON and images, verify that a user can reach a unit’s 360° tour without any backend services.

**Acceptance Scenarios**:

1. **Given** the landing map is displayed, **When** the user clicks the complex, **Then** the master plan view loads.
2. **Given** the master plan view, **When** the user selects a building, **Then** the building elevation view loads with clickable floors.
3. **Given** the building elevation, **When** the user selects a floor, **Then** the floor plan with clickable units loads.
4. **Given** the floor plan, **When** the user selects a unit and chooses “View Virtual Tour”, **Then** the 360° viewer opens at the unit’s default scene.
5. **Given** the 360° viewer is open, **When** the user clicks a hotspot, **Then** the viewer transitions smoothly to the linked scene and preloads adjacent scenes.

---

### User Story 2 - Search & Filter Units (Priority: P2)

A visitor filters units by area, bedrooms, bathrooms, floor, and availability. Matching units are highlighted in context and/or listed.

**Why this priority**: Enables users to quickly find relevant units without exploring every building/floor.

**Independent Test**: With sample `/public/data/units.json`, verify filters narrow results and selection opens the correct unit details.

**Acceptance Scenarios**:

1. **Given** a filters panel, **When** the user applies an area range and bedroom count, **Then** only matching units are highlighted or listed.
2. **Given** filtered results, **When** the user selects a unit from the list, **Then** the application navigates to that unit’s detail state.

---

### User Story 3 - Master Plan Exploration (Priority: P3)

A visitor explores the master plan by cycling through isometric angles and hovering/clicking buildings to see names and summaries.

**Why this priority**: Enhances orientation and discoverability across the complex.

**Independent Test**: Verify cycling between 4–6 static angles, building hotspots, and hover summaries without backend calls.

**Acceptance Scenarios**:

1. **Given** the master plan view, **When** the user swipes or clicks arrows, **Then** the view cycles through available isometric angles.
2. **Given** the master plan view, **When** the user hovers a building hotspot, **Then** name and summary info (floors, available units) appear.
3. **Given** a building hotspot, **When** the user clicks it, **Then** the app transitions to the building elevation view.

---

### User Story 4 - Street View (Priority: P3)

A visitor explores outdoor panorama points connected by simple hotspots.

**Why this priority**: Enhances context with minimal scope (hotspot-only navigation) while reusing the existing viewer.

**Independent Test**: Using sample outdoor scene images and JSON links, verify hotspot navigation between outdoor scenes.

**Acceptance Scenarios**:

1. **Given** a Street View entry action is available, **When** the user opens it, **Then** an outdoor panorama scene loads as the starting point.
2. **Given** the outdoor scene is open, **When** the user clicks a hotspot, **Then** the viewer transitions to the linked scene within 1 second and shows a loading affordance during fetch.
3. **Given** multiple linked outdoor scenes, **When** the user navigates sequentially, **Then** adjacent scenes are preloaded when feasible without blocking interaction.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- Missing or corrupt assets (images/JSON) should fail gracefully with user-friendly messages.
- Invalid hotspot coordinates should be ignored and logged (dev console) without blocking other interactions.
- Very large images or slow networks should show a lightweight loading indicator; allow cancel/close during loading.
- Deep links to unit/floor/building states should either resolve correctly (hash routing) or fallback to a safe default with notice.
- Mobile devices with limited memory should avoid preloading too many large pano images at once.

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The site MUST load a landing map image and display landmark hotspots defined in static JSON.
- **FR-002**: Clicking the complex hotspot MUST navigate to the master plan view.
- **FR-003**: Master plan view MUST cycle through 4–6 static angles with smooth transitions and display clickable building hotspots.
- **FR-004**: Hovering a building MUST display name and summary info (total floors, available units) sourced from JSON.
- **FR-005**: Building elevation view MUST render clickable floors; selecting a floor MUST open the floor plan.
- **FR-006**: Floor plan view MUST render clickable unit hotspots and show a tooltip with Unit ID, area (m²), bedrooms, bathrooms, availability, and optional price.
- **FR-007**: Selecting a unit MUST open a detail panel/modal with complete unit attributes and an action to “View Virtual Tour”.
- **FR-008**: Virtual tour viewer MUST load the unit’s default pano scene from JSON and allow navigation via hotspots between scenes with fade animation; adjacent scenes SHOULD be preloaded.
- **FR-009**: Filters panel MUST allow filtering by area range, bedrooms, bathrooms, floor number, and availability; results MUST update highlights/list accordingly.
- **FR-010**: Selecting a unit from a filtered list MUST navigate to that unit’s detail state.
- **FR-011**: The application MUST provide shareable deep links via hash-based routing (e.g., `#/building/B1/floor/3/unit/U301`) that restore exact building/floor/unit state on open and refresh. If history routing is chosen later, a static `404.html` fallback MUST be provided to preserve deep link behavior on static hosts.
- **FR-012**: The UI MUST provide back navigation at each stage and be responsive across common screen sizes.
- **FR-013**: Accessibility MUST cover keyboard navigation for interactive elements, descriptive alt text for images, and sufficient color contrast.
- **FR-014**: Basic performance MUST ensure initial interactive view loads quickly; large pano assets SHOULD show a loading indicator and avoid blocking the UI.
- **FR-015**: Street View mode MUST be included in the initial release with simple 360 panorama hotspots connecting outdoor scenes; it MUST reuse the panorama viewer and does not require advanced annotations beyond hotspot navigation.

- **FR-016**: Unit availability statuses are limited to: Available, Reserved, Sold. Filters, badges, and summaries MUST reflect only these values.

Assumptions (non-binding defaults unless changed during clarify):

- Availability statuses are: Available, Reserved, Sold.
- Unit price is optional and may be omitted from some units. Default: hide when missing.
- Deep links are shareable and open the exact state (hash-based routing chosen by default).

### Static web app constraints (if this project uses the static constitution)

- No backend or serverless functions; all functionality must run in the browser
- Do not embed secrets or API keys in client code; only anonymous, read‑only APIs allowed
- Build MUST output a host‑agnostic `dist/` (or `build/`) with `index.html` at root
- Routing MUST work statically (hash routing or 404.html fallback for deep links)

### Key Entities _(include if feature involves data)_

- **Map**: Landing visual and clickable landmarks; attributes: image path, landmark list.
- **Landmark**: Name, coordinates/shape; action: animate path or navigate.
- **MasterPlan**: Set of isometric angle images; building overlay definitions; summary data per building.
- **Building**: Identifier, name, total floors, available units, elevation image, floors.
- **Floor**: Building reference, number/index, plan image, unit hotspot definitions.
- **Unit**: ID, area (m²), bedrooms, bathrooms, availability, optional price, tour reference.
  - Availability ∈ {Available, Reserved, Sold}
- **PanoScene**: id, image path, links[] with targets and coordinates; optional metadata (initial view).

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: A first-time visitor can open a unit’s 360° tour from the landing page in ≤ 3 steps per level (map → master plan → building → floor → unit) and under 15 seconds on a typical broadband connection.
- **SC-002**: Filtering returns matching results in ≤ 1 second for up to 1,000 units in the dataset.
- **SC-003**: 95% of interactive hotspots (buildings, floors, units, tour links) are usable via keyboard and have visible focus indicators.
- **SC-004**: Initial interactive view (map or master plan) becomes usable in ≤ 2 seconds on a mainstream device; large pano scenes show a loading affordance within 300 ms of request.
- **SC-005**: Deep links reliably restore the exact building/floor/unit state after page reload and when opened from a shared URL in 100% of tested cases.
- **SC-006**: At least 80% of test participants report they can locate a unit of interest using filters without guidance.
- **SC-007**: In Street View mode, users can navigate between at least 3 outdoor scenes via hotspots, with transitions initiating within 300 ms and completing within 1 second on a typical broadband connection.
