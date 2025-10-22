# Aurora Complex - Interactive Viewer

An immersive real estate exploration platform featuring 360° panoramic tours, interactive floor plans, and dynamic building visualizations.

## 🚀 Features

- **Interactive Map View**: Campus overview with landmark hotspots and animated navigation paths
- **Master Plan Exploration**: 4-angle isometric views with smooth transitions and building selection
- **Building Elevations**: Multi-floor building views with unit availability indicators
- **Floor Plan Viewer**: Interactive floor plans with unit tooltips and direct tour access
- **360° Panorama Tours**: Immersive virtual tours with scene-to-scene navigation
- **Street View**: Outdoor panorama exploration accessible from master plan hotspots
- **Model Browser**: Search and filter unit models by size, bedrooms, and bathrooms

## 🛠️ Tech Stack

- **React 18** + **TypeScript** - Modern UI framework with type safety
- **Vite** - Fast build tool and dev server
- **React Router** - Hash-based routing for static hosting
- **Framer Motion** - Smooth animations and transitions
- **TailwindCSS** - Utility-first styling
- **Photo Sphere Viewer** - 360° panorama rendering
- **Lucide React** - Icon library

## 📁 Project Structure

```structure
project_x/
├── public/
│   ├── data/                    # Static JSON data files
│   │   ├── landmarks.json       # Map view hotspots
│   │   ├── models.json          # Unit model specifications
│   │   ├── units.json           # Unit instances
│   │   ├── buildings/           # Building data
│   │   │   └── {buildingId}/
│   │   │       ├── building.json
│   │   │       └── floors/
│   │   │           └── {floorId}.json
│   │   ├── masterplan/          # Master plan angles
│   │   │   ├── buildings.json
│   │   │   ├── angles/          # Angle images
│   │   │   └── transitions/     # Frame sequences
│   │   ├── models/              # Model preview images
│   │   │   └── model-{id}.jpg
│   │   └── tours/               # 360° tour data
│   │       ├── {tourId}/
│   │       │   ├── tour.json
│   │       │   └── *.jpg        # Panorama images
│   │       └── street-view/     # Outdoor tour
│   └── 404.html                 # SPA fallback for static hosting
├── src/
│   ├── components/              # Reusable UI components
│   ├── data/                    # Data loaders and types
│   ├── pages/                   # Route pages
│   ├── routes/                  # Routing configuration
│   ├── styles/                  # Global styles
│   └── types/                   # TypeScript declarations
└── specs/                       # Project documentation
    └── 001-interactive-complex-viewer/
        ├── spec.md              # Feature specification
        ├── data-model.md        # Data structure docs
        ├── tasks.md             # Implementation checklist
        └── contracts/           # JSON schemas

```

## 🎯 Data Model

### Core Entities

- **Model**: Unit blueprint (e.g., "Model A-1" with 2BR/2BA)
- **Unit**: Specific instance of a model (e.g., "Unit B11-32 on Floor 3")
- **Floor**: Contains multiple units with SVG floor plan
- **Building**: Contains multiple floors with elevation image
- **Tour**: 360° panorama scenes linked together

### Data Normalization

- Models define specifications (area, beds, baths, tour path, image)
- Units reference models via `modelId` (adds location, availability)
- Floors reference units (adds SVG hotspot polygons)
- Tours optionally reference models via `modelId` (null for street view)

## 🏃 Getting Started

### Prerequisites

- Node.js LTS (v18+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Development Server

The app will run at `http://localhost:5173` (default Vite port).

## 📝 Adding Data

### Add a New Building

1. Create `/public/data/buildings/{buildingId}/building.json`
2. Add building reference to `/public/data/masterplan/buildings.json`
3. Add building hotspots to relevant angle configurations
4. Create floor data files in `buildings/{buildingId}/floors/`

### Add a New Unit Model

1. Add model entry to `/public/data/models.json`
2. Add model preview image to `/public/data/models/model-{id}.jpg`
3. Create tour data in `/public/data/tours/model-{id}/`
4. Add unit instances to `/public/data/units.json` referencing the `modelId`

### Add a New Tour

1. Create `/public/data/tours/{tourId}/tour.json`
2. Add panorama images (equirectangular 2:1 ratio)
3. Define scenes with links for navigation
4. Set `modelId` (for unit tours) or `null` (for street view)
5. Add tour hotspot to master plan (optional)

### Data Validation

JSON schemas are located in `specs/001-interactive-complex-viewer/contracts/`:

- `model.schema.json`
- `unit.schema.json`
- `floor.schema.json`
- `building.schema.json`
- `masterplan.schema.json`
- `tour.schema.json`
- `landmarks.schema.json`

Schemas are validated automatically in development mode via Ajv.

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to change the emerald accent color:

```js
colors: {
  emerald: colors.emerald, // Change to your preferred color
}
```

### Animations

Framer Motion animations are configured inline. Common patterns:

- **Slide panels**: `initial={{ x: "100%" }}`, `animate={{ x: 0 }}`
- **Fade transitions**: `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`
- **Scale effects**: `whileHover={{ scale: 1.05 }}`

## 🚢 Deployment

### Static Hosting (Recommended)

The app uses hash routing and is fully compatible with static hosts:

1. **Build**: `npm run build`
2. **Upload**: Deploy `dist/` folder to:
   - GitHub Pages
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static file server

The `404.html` file ensures deep links work on all platforms.

### Environment Variables

No environment variables required - all data is static JSON.

## ♿ Accessibility

- Keyboard navigation fully supported (Tab, Enter, Space)
- ARIA labels on all interactive elements
- Focus styles visible on all controls
- Screen reader compatible
- Alt text on all images

## 📄 License

[Your License Here]

## 🤝 Contributing

[Your contribution guidelines]

## 📧 Contact

[Your contact information]

---

Built with ❤️ using React + Vite + TypeScript
