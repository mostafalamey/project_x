# Implementation Plan: Design System with Global Theme Tokens

**Branch**: `003-design-system-tokens` | **Date**: 2025-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-design-system-tokens/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Implement a comprehensive design system that centralizes all visual styling tokens (colors, spacing, typography, shadows, borders, transitions) in a single location. The system will use CSS custom properties integrated with TailwindCSS theme configuration to enable changing any design token once and having that change propagate throughout the entire website. The design system will support light/dark themes, provide visual token reference documentation, and include developer-friendly error handling for invalid token references.

## Technical Context

**Language/Version**: TypeScript 5.3.3 with React 18.3.1  
**Primary Dependencies**: TailwindCSS 3.4.7, CSS Custom Properties (native browser), Framer Motion 11.0.0 (for transitions)  
**Storage**: Browser localStorage (for theme preference persistence), JSON configuration files in `/public/data/` (for token documentation if needed)  
**Testing**: ESLint for linting, manual testing for visual consistency  
**Target Platform**: Modern browsers with CSS custom properties support (Chrome 49+, Firefox 31+, Safari 9.1+, Edge 15+)  
**Project Type**: Static web application (Vite + React)  
**Performance Goals**: Token changes must apply instantly (<16ms for 60fps), theme switching <100ms, no runtime performance impact  
**Constraints**: Static-only (P1), no build-time theme generation complexity, CSS custom properties only (no JavaScript-based theming), accessible color contrast ratios (WCAG AA minimum)  
**Scale/Scope**: 50-100 design tokens across 6 categories (colors, spacing, typography, shadows, borders, transitions), 20+ existing components to migrate

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **P1. Static-Only Delivery**: Design tokens implemented via CSS custom properties and TailwindCSS configuration. No server-side processing required. Theme switching uses client-side JavaScript with localStorage. Hash-based routing already in place.

✅ **P2. Zero Secrets & Write-Safe**: No secrets or API keys required. Theme preferences stored in browser localStorage (client-side only). All token definitions are public configuration.

✅ **P3. Deterministic Build Artifact**: `npm run build` produces `dist/` with all CSS including design tokens compiled. TailwindCSS processes theme configuration at build time. Token documentation (if generated) will be static HTML/JSON.

✅ **P4. Accessibility & Basic Performance**:

- Accessibility: WCAG AA color contrast enforced in token definitions, semantic token naming supports screen readers
- Performance: CSS custom properties have zero runtime overhead, TailwindCSS output optimized via PurgeCSS, theme switching via class toggle is instant

**Gate Status**: ✅ PASS - No violations. Feature fully compliant with constitution.

**Post-Phase 1 Re-check**: ✅ PASS

- P1: Confirmed - All design tokens in CSS files, no server processing
- P2: Confirmed - No secrets, theme preference in localStorage only
- P3: Confirmed - Build produces static dist/ with tokens compiled into CSS
- P4: Confirmed - Color contrast will be validated, CSS custom properties have zero overhead

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

```text
# Static web app structure
public/               # Static assets copied as-is
├── data/            # JSON configuration files
└── assets/          # Images, fonts, etc.

src/                  # Source files
├── styles/
│   ├── index.css              # Main CSS entry (imports tokens)
│   ├── tokens/                # NEW: Design token definitions
│   │   ├── colors.css         # Color tokens (CSS custom properties)
│   │   ├── spacing.css        # Spacing scale tokens
│   │   ├── typography.css     # Font size, weight, line height tokens
│   │   ├── shadows.css        # Shadow elevation tokens
│   │   ├── borders.css        # Border radius tokens
│   │   ├── transitions.css    # Animation duration/easing tokens
│   │   └── themes/            # Theme variants
│   │       ├── light.css      # Light theme token values
│   │       └── dark.css       # Dark theme token values
│   └── components/            # Component-specific styles (if needed)
├── components/       # React components (to be migrated to use tokens)
├── pages/           # Page components
├── hooks/           # React hooks
│   └── useTheme.ts           # NEW: Theme management hook
├── contexts/        # React contexts
│   └── ThemeContext.tsx      # NEW: Theme context for app-wide state
└── utils/
    └── theme.ts              # NEW: Theme persistence utilities

dist/                 # Build output (generated by Vite)

tailwind.config.js    # MODIFIED: Extend with token references
```

**Structure Decision**: Static web app structure (Option S). The design system will be implemented as a new `/src/styles/tokens/` directory containing CSS custom property definitions organized by category. TailwindCSS configuration will be extended to reference these tokens. A new theme context and hook will manage theme switching and persistence.

## Complexity Tracking

Note: Fill ONLY if Constitution Check has violations that must be justified

**No violations to justify** - Feature is fully compliant with all constitution principles.

## Phase Completion Summary

### Phase 0: Research ✅ Complete

**Generated**: `research.md`

**Key Decisions**:

1. CSS custom properties + TailwindCSS integration
2. Semantic token naming (BEM-inspired structure)
3. Class-based theme switching with localStorage persistence
4. Token organization by category in separate CSS files
5. Layered color system (base → semantic → contextual)
6. 8-point grid spacing scale with t-shirt sizing
7. Development error indicators (magenta + console warnings)
8. Separate typography tokens (size, weight, line-height)
9. Three-level shadow system
10. Duration-only transition tokens

**All NEEDS CLARIFICATION items resolved** through research and best practices.

### Phase 1: Design & Contracts ✅ Complete

**Generated**:

- `data-model.md` - Defines Design Token, Token Category, Theme Variant, Theme Preference entities
- `contracts/` directory:
  - `theme-preference.schema.json` - localStorage theme preference structure
  - `design-token.schema.json` - Token metadata structure
  - `README.md` - Contract documentation
- `quickstart.md` - Developer and designer guide for using the design system
- Updated `.github/copilot-instructions.md` with new technologies

**Key Entities**:

- Design Token (CSS custom property with metadata)
- Token Category (logical grouping)
- Theme Variant (light/dark mode)
- Theme Preference (runtime state in localStorage)

**Contracts**: JSON schemas for theme preference and token metadata (optional validation/documentation)

### Next Steps

Run `/speckit.tasks` to generate the implementation task breakdown (Phase 2).

## Implementation Notes

### Critical Path

1. Create token directory structure (`src/styles/tokens/`)
2. Define base color tokens (light + dark themes)
3. Extend TailwindCSS config to reference tokens
4. Create theme context and useTheme hook
5. Implement OS preference detection and localStorage persistence
6. Define remaining token categories (spacing, typography, shadows, borders, transitions)
7. Migrate existing components to use tokens (incremental)
8. Create token reference documentation page (P3)

### Risk Mitigation

- **Flash of wrong theme**: Inline theme detection script in `<head>`
- **Breaking existing styles**: Migrate incrementally, test each component
- **Token proliferation**: Start minimal (30-40 tokens), expand as needed
- **Inconsistent usage**: ESLint rules to flag hard-coded values

### Success Metrics (from spec)

- SC-001: Primary color change updates 20+ UI elements ✓
- SC-002: 100% token adoption, zero hard-coded values ✓
- SC-003: New component built in <30 min ✓
- SC-004: Zero visual inconsistencies ✓
- SC-005: Theme switching with persistence ✓
- SC-006: 100% token documentation coverage ✓
