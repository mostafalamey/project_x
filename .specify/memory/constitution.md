<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: No changes to existing principles (P1-P4 remain stable)
- Added sections: "Project Identity" section added with concrete project details
- Removed sections: None
- Templates requiring updates:
	✅ .specify/templates/plan-template.md (already aligned with static web app structure)
	✅ .specify/templates/tasks-template.md (already includes static web app foundational tasks)
	✅ .specify/templates/spec-template.md (already includes static web app constraints)
	✅ No command templates directory exists (no action needed)
	✅ README.md (already reflects constitution principles)
	✅ package.json (build script produces dist/, meets P3 requirements)
- Version bump rationale: MINOR (1.1.0) - Added Project Identity section with concrete values
- Constitution now fully populated; RATIFICATION_DATE set to initial feature branch creation
- Follow-up TODOs: None
-->

# Aurora Complex - Interactive Viewer Constitution

## Project Identity

**Project Name**: Aurora Complex - Interactive Viewer  
**Repository**: project_x  
**Purpose**: An immersive real estate exploration platform featuring 360° panoramic tours, interactive floor plans, and dynamic building visualizations  
**Tech Stack**: React 18 + TypeScript, Vite, React Router (hash-based), TailwindCSS, Framer Motion, Photo Sphere Viewer  
**Deployment Model**: Static hosting (Vercel, Netlify, GitHub Pages, or any static CDN)  
**Data Strategy**: JSON-driven configuration files in `/public/data/`

## Core Principles

### P1. Static‑Only Delivery (NON‑NEGOTIABLE)

The application MUST be deliverable as static assets only: HTML, CSS, JS, and media
files served from a static host. No server‑side code, serverless functions, runtime
compute, or databases are permitted. Client‑side routing MUST work without custom
server configuration (use hash‑based routing or pre‑rendered paths).

Rationale: Purely static delivery maximizes portability, lowers cost, and minimizes
security surface area.

### P2. Zero Secrets & Write‑Safe

No secrets, API keys, or credentials MAY be embedded in client code or build
artifacts. Any external integrations MUST be anonymous, read‑only, and publicly
cacheable. Features requiring authenticated or write operations are out of scope for
this static application.

Rationale: Front‑end secrets are not secret; limiting to read‑only anonymous access
eliminates abuse and backend requirements.

### P3. Deterministic Build Artifact

A single build command MUST produce a complete, deterministic output directory
named dist/ (preferred) or build/ containing index.html at the root and all required
assets with relative paths. The artifact MUST be host‑agnostic (no environment‑specific
runtime needed) and include a static 404.html or use hash routing so deep links resolve
without server rewrites.

Rationale: Standardized artifacts enable one‑step deploys to any static host.

### P4. Accessibility & Basic Performance

Baseline accessibility and performance are REQUIRED:

- Images have descriptive alt text; interactive controls are keyboard accessible; sufficient color contrast is maintained.
- Avoid blocking bundles: the largest JS bundle ≤ 200 KB gzipped; defer/async non‑critical scripts; optimize images.

Rationale: Static sites must be fast and usable by default.

## Additional Constraints

- **Hosting**: Any static host (GitHub Pages, Netlify, Vercel, Render). No serverless functions or custom servers permitted.
- **Routing**: Hash‑based routing via React Router DOM (`HashRouter`). A static `404.html` is included as fallback.
- **Assets**: Public assets stored in `public/` directory; build outputs to `dist/` with content-hashed filenames via Vite.
- **Data Files**: All configuration data in `public/data/` as JSON files with corresponding JSON schemas in `specs/001-interactive-complex-viewer/contracts/`.
- **Build Command**: Single `npm run build` command produces complete `dist/` artifact ready for deployment.
- **Dependencies**: All runtime dependencies are client-side libraries; no server-side dependencies in production.

## Development Workflow

- **Repository Scope**: Single web client only; no backend or database code.
- **Scripts**:
  - `npm run build` (required) - produces `dist/` directory
  - `npm run dev` (optional) - Vite development server
  - `npm run lint` (optional) - ESLint validation
  - `npm run preview` (optional) - preview production build locally
- **Reviews**: Each PR MUST include a Constitution Check confirming compliance with P1–P4.
- **Testing**: Linting via ESLint with TypeScript; format checks optional. Full test suite not required for static content.
- **Git Workflow**: Feature branches from `master`, named `###-feature-name` pattern (e.g., `001-interactive-complex-viewer`).

## Governance

- Supremacy: This constitution governs the static web application and supersedes conflicting practices.
- Amendments: Proposed via PR with a rationale and a summary of impacts. Upon merge, update version and Last Amended date.
- Versioning: Semantic versioning for governance changes
  - MAJOR: Backward‑incompatible changes to principles/governance
  - MINOR: New principle/section or material expansion
  - PATCH: Clarifications/typos/non‑semantic edits
- Compliance: Reviewers MUST verify Constitution Check on every PR. A periodic (at least quarterly) compliance sweep is recommended for long‑lived projects.

**Version**: 1.1.0 | **Ratified**: 2025-10-21 | **Last Amended**: 2025-10-23
