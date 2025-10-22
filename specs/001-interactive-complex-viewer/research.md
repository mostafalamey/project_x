# Research: Real Estate Complex Interactive Viewer

Date: 2025-10-22
Spec: D:/websites/Project_X/project_x/specs/001-interactive-complex-viewer/spec.md

## Decisions and Rationale

### Routing: Hash-based deep links

- Decision: Use hash routing (e.g., `#/building/B1/floor/3/unit/U301`)
- Rationale: Works reliably on static hosts without server rewrites; required for shareable deep links.
- Alternatives: History API + static 404.html fallback (more host-specific), Query-string state (less readable, harder to bookmark).

### Panorama Viewer: react-photo-sphere-viewer

- Decision: Use `react-photo-sphere-viewer` for unit tours and Street View hotspots.
- Rationale: Mature, supports hotspots and transitions; fits static asset loading.
- Alternatives: Three.js custom viewer (more work), other 360 libraries (less documented or heavier).

### Data contracts: JSON under /public/data

- Decision: Store map, master plan, buildings, floors, units, and pano scenes as JSON files loaded at runtime.
- Rationale: Simple static hosting, transparent cacheability, aligns with static constitution.
- Alternatives: Headless CMS or remote API (violates zero‑secret constraint), embedding data in JS bundles (less cache-friendly).

### Performance budgets

- Decision: Keep largest JS bundle ≤ 200 KB gzipped; show loading affordance within 300 ms; first interactive view ≤ 2 s.
- Rationale: Matches constitution baseline and spec success criteria; user experience expectations.
- Alternatives: Larger budgets (risk slower UX), aggressive code splitting (added complexity; evaluate if needed).

### Accessibility baseline

- Decision: Keyboard-accessible hotspots and navigation; alt text for images; visible focus; sufficient contrast.
- Rationale: Constitution P4 and success criteria (95% hotspot usability via keyboard).
- Alternatives: Defer a11y (unacceptable per constitution).

## Best Practices

- Vite for static build; ensure `base` configured for hash routing and relative assets; output to `dist/`.
- Image optimization pipeline for large panoramas; consider responsive sizes where possible.
- Preload adjacent pano scenes only when reasonable to avoid memory pressure on mobile.
- JSON schema validation in development to catch malformed data early.
- Lighthouse checks as part of local verification (optional per constitution).

## Open Questions (Resolved in Spec)

- Deep link shareability: REQUIRED (hash routing).
- Availability statuses: {Available, Reserved, Sold}.
- Street View scope: Simple hotspots included in initial release.
