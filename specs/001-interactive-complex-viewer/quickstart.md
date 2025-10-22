# Quickstart: Real Estate Complex Interactive Viewer

This quickstart describes how to run the static app locally and where to place data and images.

## Prerequisites

- Node.js LTS installed

## Install & Run

- Install dependencies
- Start dev server
- Build static artifact

## Data Placement

- Place JSON and images under `/public/data` and `/public` respectively.
- Ensure JSON matches the schemas in `/contracts/`.

## Routing

- Uses hash-based routing for shareable deep links that work on static hosts.

## Build Output

- Build produces a `dist/` folder with `index.html` at root and relative asset paths.
- Include a `404.html` if switching to history routing on a host that supports fallback.

## Performance & Accessibility

- Keep largest JS bundle ≤ 200 KB gzipped.
- Provide keyboard access and visible focus for all hotspots.
- Show loading indicators for large panorama image loads.
