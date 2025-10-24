# project_x Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-22

## Active Technologies
- JavaScript/TypeScript (browser); Node LTS for tooling + React, Vite, react-router-dom (hash routing), TailwindCSS, Framer Motion, react-photo-sphere-viewer (001-interactive-complex-viewer)
- TypeScript 5.x with React 18.3 + Framer Motion 11.0 (animations), React Photo Sphere Viewer 2.0 (panoramas), React Router DOM 6.25 (navigation) (002-zoom-pan-transitions)
- N/A (all state in-memory, no persistence) (002-zoom-pan-transitions)
- TypeScript 5.3.3 with React 18.3.1 + TailwindCSS 3.4.7, CSS Custom Properties (native browser), Framer Motion 11.0.0 (for transitions) (003-design-system-tokens)
- Browser localStorage (for theme preference persistence), JSON configuration files in `/public/data/` (for token documentation if needed) (003-design-system-tokens)

## Project Structure
```
backend/
frontend/
tests/
```

## Commands
npm test; npm run lint

## Code Style
JavaScript/TypeScript (browser); Node LTS for tooling: Follow standard conventions

## Recent Changes
- 003-design-system-tokens: Added TypeScript 5.3.3 with React 18.3.1 + TailwindCSS 3.4.7, CSS Custom Properties (native browser), Framer Motion 11.0.0 (for transitions)
- 002-zoom-pan-transitions: Added TypeScript 5.x with React 18.3 + Framer Motion 11.0 (animations), React Photo Sphere Viewer 2.0 (panoramas), React Router DOM 6.25 (navigation)
- 001-interactive-complex-viewer: Added JavaScript/TypeScript (browser); Node LTS for tooling + React, Vite, react-router-dom (hash routing), TailwindCSS, Framer Motion, react-photo-sphere-viewer

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
