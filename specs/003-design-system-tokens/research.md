# Research: Design System with Global Theme Tokens

**Feature**: 003-design-system-tokens  
**Date**: 2025-10-24  
**Status**: Complete

## Overview

This research document consolidates findings for implementing a design system using CSS custom properties (CSS variables) integrated with TailwindCSS for the Aurora Complex Interactive Viewer. The design system must be fully static, support light/dark themes, and provide centralized control over all visual styling tokens.

## Key Research Areas

### 1. CSS Custom Properties + TailwindCSS Integration

**Decision**: Use CSS custom properties as the foundation, referenced by TailwindCSS theme configuration

**Rationale**:

- **Runtime flexibility**: CSS custom properties can be changed dynamically (required for theme switching) without rebuilding
- **Native browser support**: Excellent support across all modern browsers (Chrome 49+, Firefox 31+, Safari 9.1+)
- **Zero overhead**: No JavaScript required for token application, only for theme switching
- **TailwindCSS compatibility**: TailwindCSS v3.4+ can reference CSS variables in theme config via `var(--token-name)` syntax
- **Cascade support**: CSS variables respect the cascade, enabling theme variants via class overrides

**Alternatives Considered**:

- **Pure TailwindCSS theme**: Rejected - requires rebuild to change values, no runtime theme switching
- **CSS-in-JS (styled-components, emotion)**: Rejected - adds bundle size, requires JavaScript for all styles, violates static-only principle
- **SCSS variables**: Rejected - compile-time only, cannot support runtime theme switching
- **JavaScript theme objects**: Rejected - requires JavaScript execution for styling, performance overhead

**Implementation Pattern**:

```css
/* src/styles/tokens/colors.css */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
}

.dark {
  --color-primary: #60a5fa;
  --color-secondary: #a78bfa;
}
```

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
      },
    },
  },
};
```

### 2. Token Naming Conventions

**Decision**: Use semantic, purpose-based naming with BEM-inspired structure

**Rationale**:

- **Clarity**: Semantic names (e.g., `--color-primary`, `--spacing-md`) communicate intent
- **Maintainability**: Changing "blue" to "green" doesn't require renaming `--color-primary`
- **Consistency**: Industry standard (Material Design, Tailwind, Chakra UI all use semantic naming)
- **Scalability**: Easy to extend with new tokens without confusion

**Naming Pattern**:

```text
--{category}-{property}-{variant?}
```

**Examples**:

- Colors: `--color-primary`, `--color-text-primary`, `--color-bg-elevated`
- Spacing: `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`
- Typography: `--font-size-sm`, `--font-weight-bold`, `--line-height-tight`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Borders: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
- Transitions: `--duration-fast`, `--duration-base`, `--duration-slow`

**Alternatives Considered**:

- **Descriptive names** (`--color-blue-500`): Rejected - not semantic, hard to rebrand
- **Abbreviations** (`--clr-pri`): Rejected - reduces readability
- **Flat structure** (`--primary`): Rejected - namespace collisions likely

### 3. Theme Switching Architecture

**Decision**: Class-based theme switching with localStorage persistence and OS preference detection

**Rationale**:

- **Simplicity**: Single class toggle on root element (`<html class="dark">`) changes all tokens
- **Performance**: Class-based switching is instant (browser repaints affected elements)
- **Accessibility**: Respects `prefers-color-scheme` media query for user OS preference
- **Persistence**: localStorage ensures theme choice persists across sessions
- **Progressive enhancement**: Works without JavaScript (defaults to OS preference via media query)

**Implementation Approach**:

1. Detect OS preference: `window.matchMedia('(prefers-color-scheme: dark)')`
2. Check localStorage for saved preference
3. Apply theme class to `<html>` element
4. Listen for manual theme toggle
5. Save preference to localStorage on change

**Alternatives Considered**:

- **Separate stylesheets**: Rejected - duplicates code, larger bundle size, flash of wrong theme
- **CSS media query only**: Rejected - no user override capability
- **Data attributes** (`data-theme="dark"`): Considered equivalent to class approach, classes chosen for convention

### 4. Token Organization Strategy

**Decision**: Organize tokens by category in separate CSS files, imported into main stylesheet

**Rationale**:

- **Modularity**: Each category (colors, spacing, etc.) in its own file for maintainability
- **Discoverability**: Developers can quickly find relevant tokens
- **Incremental loading**: Can optimize critical CSS if needed (though not required for this project)
- **Clear ownership**: Each file has a single responsibility

**File Structure**:

```text
src/styles/tokens/
├── colors.css        # All color tokens
├── spacing.css       # Spacing scale
├── typography.css    # Font tokens
├── shadows.css       # Shadow tokens
├── borders.css       # Border/radius tokens
├── transitions.css   # Animation tokens
└── themes/
    ├── light.css     # Light theme overrides (default in :root)
    └── dark.css      # Dark theme overrides (.dark class)
```

**Alternatives Considered**:

- **Single monolithic file**: Rejected - hard to navigate, merge conflicts likely
- **Per-component token files**: Rejected - tokens should be global, not component-specific
- **JSON configuration**: Rejected - requires build-time processing, loses CSS cascade benefits

### 5. Color System Architecture

**Decision**: Layered color system with base colors, semantic colors, and contextual colors

**Rationale**:

- **Flexibility**: Base colors define palette, semantic colors define purpose, contextual colors define usage
- **Consistency**: Semantic naming ensures consistent color usage across components
- **Accessibility**: Can enforce contrast ratios at the semantic layer
- **Theming**: Theme variants override base colors, semantic mappings remain stable

**Color Token Layers**:

1. **Base palette** (10-12 neutral shades + brand colors):

   - `--color-neutral-50` through `--color-neutral-950`
   - `--color-brand-primary`, `--color-brand-secondary`

2. **Semantic colors** (purpose-based):

   - `--color-primary`, `--color-secondary`
   - `--color-success`, `--color-error`, `--color-warning`, `--color-info`

3. **Contextual colors** (usage-based):
   - `--color-text-primary`, `--color-text-secondary`, `--color-text-disabled`
   - `--color-bg-base`, `--color-bg-elevated`, `--color-bg-overlay`
   - `--color-border-default`, `--color-border-focus`

**Alternatives Considered**:

- **Flat color system**: Rejected - lacks semantic meaning, hard to maintain consistency
- **Numeric scales only** (color-1 through color-10): Rejected - not semantic

### 6. Spacing Scale System

**Decision**: T-shirt sizing (xs, sm, md, lg, xl) with 8-point grid base (4px unit)

**Rationale**:

- **8-point grid**: Industry standard, aligns with most design systems and component libraries
- **Intuitive naming**: T-shirt sizes are universally understood
- **Sufficient range**: 5-7 sizes cover 90% of use cases
- **Mathematical consistency**: Exponential or linear progression provides visual harmony

**Scale Definition**:

```css
--spacing-xs:   0.25rem  (4px)
--spacing-sm:   0.5rem   (8px)
--spacing-md:   1rem     (16px)
--spacing-lg:   1.5rem   (24px)
--spacing-xl:   2rem     (32px)
--spacing-2xl:  3rem     (48px)
--spacing-3xl:  4rem     (64px)
```

**Alternatives Considered**:

- **Numeric scale** (spacing-1 through spacing-10): Rejected - less intuitive than t-shirt sizing
- **Semantic names** (spacing-tight, spacing-comfortable): Rejected - subjective, hard to pick correct value
- **10-point grid**: Rejected - doesn't align with browser default of 16px (1rem)

### 7. Development Error Handling

**Decision**: Visual error indicators in development mode via CSS and console warnings via JavaScript

**Rationale**:

- **Immediate feedback**: Developers see missing tokens instantly in UI
- **Non-blocking**: Doesn't halt development with errors
- **Clear identification**: Distinct visual indicator (e.g., magenta outline) highlights affected elements
- **Actionable**: Console warning provides token name and location

**Implementation Approach**:

1. **CSS fallback**: Use fallback values in CSS variables

   ```css
   background: var(--color-primary, magenta); /* magenta = error indicator */
   ```

2. **Build-time validation** (optional): ESLint plugin or custom script to check token references

3. **Development console warnings**: Hook into component rendering to detect magenta values

**Alternatives Considered**:

- **Silent failures with defaults**: Rejected - hides bugs, inconsistent appearance
- **Hard errors**: Rejected - blocks development unnecessarily
- **No validation**: Rejected - doesn't meet FR-013 requirement

### 8. Typography Token Structure

**Decision**: Separate tokens for size, weight, and line-height; composition in components

**Rationale**:

- **Flexibility**: Components can mix and match size/weight/line-height independently
- **Reusability**: Same font size can be used with different weights across components
- **Clarity**: Explicit token names rather than compound tokens (e.g., `--font-heading-1`)

**Token Structure**:

```css
/* Sizes */
--font-size-xs:   0.75rem   (12px)
--font-size-sm:   0.875rem  (14px)
--font-size-base: 1rem      (16px)
--font-size-lg:   1.125rem  (18px)
--font-size-xl:   1.25rem   (20px)
--font-size-2xl:  1.5rem    (24px)
--font-size-3xl:  2rem      (32px)

/* Weights */
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

/* Line Heights */
--line-height-tight:  1.25
--line-height-normal: 1.5
--line-height-loose:  1.75
```

**Alternatives Considered**:

- **Compound tokens** (`--typography-heading-1`): Rejected - less flexible, requires more tokens
- **Numeric scales**: Rejected - less intuitive than semantic names

### 9. Shadow Token Design

**Decision**: Three-level shadow system (sm, md, lg) with semantic elevation names

**Rationale**:

- **Simplicity**: Three levels sufficient for most UI (cards, dropdowns, modals)
- **Semantic naming**: Communicates visual hierarchy and elevation
- **Performance**: Fewer shadows = smaller CSS, faster rendering
- **Consistency**: Forces consistent elevation patterns across UI

**Shadow Definitions**:

```css
--shadow-sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

**Alternatives Considered**:

- **Five+ levels**: Rejected - unnecessary complexity, hard to choose
- **Descriptive names** (shadow-card, shadow-dropdown): Rejected - overly specific, limits reuse
- **Theme-aware shadows**: Considered for dark mode (lighter shadows), can be added via theme variants

### 10. Transition Token System

**Decision**: Duration tokens only; easing functions as standard cubic-bezier

**Rationale**:

- **Sufficient variety**: Three durations (fast/base/slow) cover most animations
- **Standard easings**: Use CSS keywords (`ease-out`, `ease-in-out`) for readability
- **Consistency**: Standardizing on specific durations creates cohesive motion
- **Simplicity**: Fewer tokens to manage

**Duration Definitions**:

```css
--duration-fast: 150ms
--duration-base: 300ms
--duration-slow: 500ms
```

**Standard Easings** (via TailwindCSS):

- `ease-out`: Most UI transitions (entrances, expansions)
- `ease-in-out`: Reversible animations (accordions, drawers)
- `ease-in`: Exits, closures

**Alternatives Considered**:

- **Custom easing tokens**: Rejected - adds complexity, CSS keywords sufficient
- **More durations**: Rejected - three levels provide good range
- **Per-component timings**: Rejected - reduces consistency

## Migration Strategy

### Phase 1: Foundation (P1 - Core)

1. Create token directory structure
2. Define base color palette and semantic colors
3. Extend TailwindCSS config to reference tokens
4. Create theme context and hook
5. Implement OS preference detection and localStorage persistence

### Phase 2: Token Expansion (P2 - Comprehensive)

1. Define spacing, typography, shadow, border, transition tokens
2. Add dark theme variants for all tokens
3. Migrate existing components to use tokens (prioritize high-visibility components)

### Phase 3: Documentation (P3 - Developer Experience)

1. Create token reference page showing all tokens with visual examples
2. Add JSDoc comments to theme hook
3. Document token usage in README

## Testing Approach

1. **Visual regression**: Manual testing of token changes across pages
2. **Theme switching**: Verify light/dark toggle works, localStorage persists
3. **Accessibility**: Use axe-core or Lighthouse to check color contrast
4. **Browser compatibility**: Test CSS custom properties in target browsers
5. **Error handling**: Verify invalid token references show magenta in dev mode

## Performance Considerations

- **Initial load**: CSS custom properties add ~2-5KB to stylesheet (minimal impact)
- **Runtime**: Zero JavaScript overhead for token application
- **Theme switching**: <100ms (single class toggle + browser repaint)
- **Build time**: TailwindCSS processing unaffected by token usage

## Risks and Mitigations

| Risk                                  | Impact | Mitigation                                               |
| ------------------------------------- | ------ | -------------------------------------------------------- |
| Browser support for CSS variables     | High   | Target modern browsers only (already documented in spec) |
| Flash of wrong theme on load          | Medium | Inline theme detection script in HTML head               |
| Token proliferation (too many tokens) | Medium | Start with minimal set, add as needed                    |
| Inconsistent token usage              | Medium | ESLint rules to flag hard-coded values                   |
| Breaking existing styles              | High   | Migrate incrementally, test each component               |

## References

- [MDN: CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [TailwindCSS: Theme Configuration](https://tailwindcss.com/docs/theme)
- [Material Design: Color System](https://material.io/design/color/the-color-system.html)
- [Refactoring UI: Building Your Color Palette](https://refactoringui.com/previews/building-your-color-palette/)
- [WCAG 2.1: Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [CSS Tricks: A Complete Guide to Custom Properties](https://css-tricks.com/a-complete-guide-to-custom-properties/)

## Conclusion

The design system will use CSS custom properties as the foundation, integrated with TailwindCSS for utility class generation. This approach provides runtime theme switching, zero JavaScript overhead, excellent browser support, and full compliance with the static-only constitution. The token system is organized by category, uses semantic naming conventions, and supports light/dark themes via class-based switching with localStorage persistence.
