<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles: Added
	• P1 Static‑Only Delivery (NON‑NEGOTIABLE)
	• P2 Zero Secrets & Write‑Safe
	• P3 Deterministic Build Artifact
	• P4 Accessibility & Basic Performance
- Added sections: "Additional Constraints", "Development Workflow"
- Removed sections: Template placeholders for Principles 5 and unnamed sections were consolidated/removed
- Templates requiring updates:
	✅ .specify/templates/plan-template.md (static app structure option, remove stale command file reference)
	✅ .specify/templates/tasks-template.md (static‑app foundational tasks)
	✅ .specify/templates/spec-template.md (static constraints hint)
	⚠ .specify/templates/commands/* (no command templates present; reference removed in plan template)
- Deferred TODOs:
	• TODO(RATIFICATION_DATE): Original adoption date unknown; set when historically established
-->

# Project X Constitution

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

- Hosting: Any static host (e.g., GitHub Pages, Netlify static deploy, S3+CDN). No serverless functions or custom servers.
- Routing: Prefer hash‑based routing. If history API is used, include a static 404.html that mirrors index.html behavior where the host supports it.
- Assets: Place public assets under public/ or src/assets and emit to dist/ with content‑hashed filenames where tooling supports it.

## Development Workflow

- Repository scope: single web client only; no backend or database code.
- Scripts: Provide build (required) and dev (optional) scripts; build produces dist/.
- Reviews: Each PR MUST include a Constitution Check confirming compliance with P1–P4.
- Testing: Optional for static content; if present, limit to linting/format checks and basic link checking.

## Governance

- Supremacy: This constitution governs the static web application and supersedes conflicting practices.
- Amendments: Proposed via PR with a rationale and a summary of impacts. Upon merge, update version and Last Amended date.
- Versioning: Semantic versioning for governance changes
  - MAJOR: Backward‑incompatible changes to principles/governance
  - MINOR: New principle/section or material expansion
  - PATCH: Clarifications/typos/non‑semantic edits
- Compliance: Reviewers MUST verify Constitution Check on every PR. A periodic (at least quarterly) compliance sweep is recommended for long‑lived projects.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): unknown; set when established | **Last Amended**: 2025-10-21
