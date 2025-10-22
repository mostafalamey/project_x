# 🏗️ Project Overview

Build a **React + Vite web application** for showcasing a single **real estate complex** (residential or commercial) through a fully immersive, full-screen visual journey.

At every navigation level — **map**, **master plan**, **building elevation**, **floor plan**, and **unit tour** —
➡️ the main image or 360° view must **fill the entire browser viewport (100vw × 100vh)**.
All UI elements (tooltips, buttons, info boxes, navigation controls, etc.) appear **as overlays** on top of the image or pano, never in separate panels or reducing the viewable area.

---

## ⚙️ Tech Stack

- **Frontend Framework:** React + Vite
- **Styling:** TailwindCSS + Framer Motion
- **Routing:** React Router DOM
- **State Management:** Zustand or Context
- **360° Viewer:** `react-photo-sphere-viewer`
- **Data:** Local JSON configuration files
- **Hosting:** Static hosting (Hostinger, Vercel, Netlify, Render)

---

### 🧭 Application Flow (Full-Screen by Design)

#### 1. **Map View (Landing Page)**

- Full-screen static image of the surrounding area.
- Overlaid interactive landmarks using absolutely positioned SVG or `<div>` markers.
- Hover → popup with landmark info.
- Click on landmark → animate SVG path from complex to that landmark.
- Click on the complex marker → smooth zoom-in transition to **Master Plan View**.
- Entire viewport is the image background; overlays (logo, title, buttons) sit on top using absolute positioning and gradient fades if needed.

#### 2. **Master Plan View**

- Full-screen isometric image (or sequence for pseudo-rotation).
- User can swipe or click arrows to rotate between isometric angles (change image source) if available.
- Play animation frames sequence between angle 1 and angle 2 (if available).
- Buildings are clickable hotspots (SVG regions or coordinate mapping).
- Each building should have up to 4 SVG hotspots for each camera angle.
- Hover → floating tooltip with building name and stats.
- Click → transition to **Building Elevation View**.
- No scrolling — transitions and overlays only.

#### 3. **Building Elevation View**

- Full-screen elevation image.
- Floors are overlayed transparent polygons.
- Hover → floor info overlay.
- Click → zoom transition to **Floor Plan View**.
- Floating “Back” button or breadcrumb overlayed at a fixed corner.

#### 4. **Floor Plan View**

- Full-screen floor plan image.
- Units are overlayed clickable regions (defined in JSON/SVG).
- Hover → tooltip with unit info (area, bedrooms, bathrooms, status).
- Click → dim non-selected areas, zoom slightly on selected unit, and open floating modal or sidebar overlay (semi-transparent background) with full unit details and “View 360 Tour” button.
- UI overlays (filters, navigation) are minimal and float above the plan — never resize or split the screen.

#### 5. **Virtual Tour View**

- Full-screen 360° panoramic viewer powered by `react-photo-sphere-viewer`.
- Scene data stored in JSON:

  ```json
  {
    "id": "living-room",
    "image": "/tours/living-room.jpg",
    "links": [
      { "target": "kitchen", "x": 2000, "y": -500 },
      { "target": "hallway", "x": -1500, "y": -300 }
    ]
  }
  ```

- Clicking a hotspot transitions smoothly (fade) to the next pano.
- Preload connected scenes.
- Floating UI: back arrow, unit name, mini-map, and tour controls — all absolute overlays.
- Background is always the pano, full-bleed, edge-to-edge.

#### 6. **Optional Street View Mode**

- Uses same full-screen pano engine and navigation logic.
- Hotspots represent outdoor navigation points.

---

### 🔍 **Search & Filter Overlay**

- A floating overlay that can slide in/out without affecting the main view.
- Filters: area range, bedrooms, bathrooms, floor number, availability.
- Clicking “Apply” highlights matching units in the active view (e.g., floor plan).
- When closed, the full image view remains visible underneath.

---

### 🗂️ **File Structure**

```text
/src
  /components
    MapView.jsx
    MasterPlanView.jsx
    BuildingView.jsx
    FloorPlanView.jsx
    TourViewer.jsx
    SearchPanel.jsx
  /data
    map.png
    masterplan/
      iso1.png
      iso2.png
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
```

---

### 💾 Hosting

- Host static build and assets on Hostinger, Vercel, Netlify, or Render.
- All assets (images, JSON, 360° panos) live in `/public/data`.
- No backend or database required unless filters need remote updates.

---

### 💡 **UI/UX Rules**

1. **Every view fills 100% of viewport width and height.**

   - No scrollbars.
   - No page padding.
   - Use `overflow: hidden;` globally.
   - Each main image or pano sits behind everything (z-index: 0).

2. **All UI is overlayed.**

   - Tooltips, labels, filters, buttons → `position: absolute` or `fixed`.
   - Overlays fade in/out smoothly (Framer Motion).
   - Use translucent backgrounds or blur for readability.

3. **Navigation uses animated transitions** — zooms, fades, or slides.
4. **Back navigation** always present (icon overlay top-left).
5. **Mobile responsive**: tap zones enlarge, overlays adapt to small screens.

---

### 🧩 Deliverables

- Fully functional, **full-screen immersive React app**.
- Configurable through images and JSON only.
- Documented process to replace data and assets for new projects.
- Includes one demo complex (e.g., “Jiran Complex”) as example content.

---

Would you like me to now generate the **project scaffold structure** (folder tree + base component files with Tailwind layout enforcing full-screen background image and overlay zones) — so you can drop it directly into Replit or VS Code?
