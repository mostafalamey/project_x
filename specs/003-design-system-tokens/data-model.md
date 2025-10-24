# Data Model: Design System with Global Theme Tokens

**Feature**: 003-design-system-tokens  
**Date**: 2025-10-24  
**Status**: Complete

## Overview

The design system is primarily a styling layer with minimal data structures. The main "data" consists of CSS custom properties (tokens) and a small amount of runtime state for theme management. This document outlines the logical entities and their relationships.

## Entities

### 1. Design Token

**Description**: A named CSS custom property representing a reusable visual value.

**Attributes**:

- `name` (string, required): Token name in CSS custom property format (e.g., `--color-primary`)
- `value` (string, required): CSS value (e.g., `#3b82f6`, `1rem`, `300ms`)
- `category` (enum, required): Token category - one of: `color`, `spacing`, `typography`, `shadow`, `border`, `transition`
- `description` (string, optional): Human-readable description for documentation
- `themeVariant` (enum, required): Theme context - one of: `light`, `dark`, `base` (applies to both)

**Validation Rules**:

- Token names MUST start with `--` prefix
- Token names MUST follow pattern: `--{category}-{property}-{variant?}`
- Token names MUST be lowercase with hyphens (kebab-case)
- Value MUST be valid CSS value for its category
- Color values MUST meet WCAG AA contrast ratio (4.5:1 for text, 3:1 for UI components)

**Examples**:

```json
{
  "name": "--color-primary",
  "value": "#3b82f6",
  "category": "color",
  "description": "Primary brand color for buttons, links, and key UI elements",
  "themeVariant": "light"
}
```

```json
{
  "name": "--spacing-md",
  "value": "1rem",
  "category": "spacing",
  "description": "Medium spacing for consistent margins and padding",
  "themeVariant": "base"
}
```

### 2. Token Category

**Description**: A logical grouping of related design tokens.

**Attributes**:

- `id` (string, required): Category identifier (e.g., `colors`, `spacing`)
- `name` (string, required): Display name (e.g., "Colors", "Spacing")
- `description` (string, required): Category purpose and usage guidelines
- `tokens` (array of Design Token, required): All tokens in this category
- `cssFile` (string, required): File path where tokens are defined (e.g., `src/styles/tokens/colors.css`)

**Validation Rules**:

- Category id MUST be unique
- All tokens in category MUST have matching category field
- CSS file MUST exist and contain all listed tokens

**Example**:

```json
{
  "id": "colors",
  "name": "Colors",
  "description": "Color tokens for all UI elements including brand colors, semantic colors, and contextual colors",
  "tokens": [
    {
      "name": "--color-primary",
      "value": "#3b82f6",
      "category": "color",
      "themeVariant": "light"
    },
    {
      "name": "--color-secondary",
      "value": "#8b5cf6",
      "category": "color",
      "themeVariant": "light"
    }
  ],
  "cssFile": "src/styles/tokens/colors.css"
}
```

### 3. Theme Variant

**Description**: A collection of token values for a specific visual theme (light or dark mode).

**Attributes**:

- `id` (string, required): Variant identifier - one of: `light`, `dark`
- `name` (string, required): Display name (e.g., "Light Theme", "Dark Theme")
- `isDefault` (boolean, required): Whether this is the default theme
- `cssSelector` (string, required): CSS selector to apply theme (e.g., `:root`, `.dark`)
- `tokens` (array of Design Token, required): Token overrides for this theme

**Validation Rules**:

- Exactly one theme variant MUST have isDefault = true
- Light theme MUST use `:root` selector
- Dark theme MUST use `.dark` class selector
- All semantic color tokens MUST be defined in both themes

**Example**:

```json
{
  "id": "dark",
  "name": "Dark Theme",
  "isDefault": false,
  "cssSelector": ".dark",
  "tokens": [
    {
      "name": "--color-primary",
      "value": "#60a5fa",
      "category": "color",
      "themeVariant": "dark"
    },
    {
      "name": "--color-bg-base",
      "value": "#1f2937",
      "category": "color",
      "themeVariant": "dark"
    }
  ]
}
```

### 4. Theme Preference

**Description**: Runtime state representing the user's theme choice.

**Attributes**:

- `theme` (enum, required): Active theme - one of: `light`, `dark`, `system`
- `source` (enum, required): How preference was determined - one of: `localStorage`, `osPreference`, `default`
- `timestamp` (number, optional): When preference was last changed (Unix timestamp)

**Storage Location**: Browser localStorage, key: `aurora-theme-preference`

**Validation Rules**:

- If source is `localStorage`, timestamp MUST be present
- If source is `osPreference`, theme MUST match OS setting
- localStorage value MUST be valid JSON

**Example (localStorage)**:

```json
{
  "theme": "dark",
  "source": "localStorage",
  "timestamp": 1729728000000
}
```

### 5. Token Reference Documentation

**Description**: Metadata for displaying token reference page.

**Attributes**:

- `category` (Token Category, required): Category being documented
- `exampleCode` (string, optional): Code snippet showing token usage
- `visualExample` (object, optional): Configuration for visual preview
  - `type` (enum): Preview type - `color-swatch`, `spacing-box`, `typography-sample`, `shadow-card`, `border-demo`, `transition-demo`
  - `config` (object): Type-specific configuration

**Example**:

```json
{
  "category": {
    "id": "colors",
    "name": "Colors",
    "tokens": [...]
  },
  "exampleCode": "<button class=\"bg-primary text-white\">Button</button>",
  "visualExample": {
    "type": "color-swatch",
    "config": {
      "shape": "square",
      "size": "lg",
      "showHex": true
    }
  }
}
```

## Relationships

```text
Token Category (1) ──── contains ──── (many) Design Token
Theme Variant (1)  ──── defines ────  (many) Design Token
Theme Preference   ──── selects ────  (1) Theme Variant
Token Reference    ──── documents ──  (1) Token Category
```

## State Transitions

### Theme Preference State Machine

```text
States:
- Uninitialized (no preference set)
- System (following OS preference)
- Light (user selected light)
- Dark (user selected dark)

Transitions:
1. App Load → Check localStorage → (exists) → Set from storage
                                  → (missing) → Detect OS preference → System
2. System → User toggles theme → Light/Dark → Save to localStorage
3. Light/Dark → User toggles theme → Light/Dark → Update localStorage
4. Light/Dark → localStorage cleared → System
5. System → OS preference changes → Update active theme (if still in System state)
```

## Data Flow

### 1. Initial Theme Detection (App Load)

```text
1. App.tsx mounts
2. useTheme hook initializes
3. Check localStorage for saved preference
   → If exists: Apply saved theme (light/dark)
   → If missing: Detect OS preference via matchMedia
4. Apply theme class to <html> element
5. Render UI with theme-specific token values
```

### 2. Manual Theme Toggle

```text
1. User clicks theme toggle button
2. toggleTheme() function called
3. Determine next theme (light → dark → light)
4. Update state (theme preference)
5. Apply theme class to <html> element
6. Save preference to localStorage
7. UI re-renders with new token values (CSS cascade handles update)
```

### 3. Token Usage in Components

```text
1. Component needs styling (e.g., button background)
2. Component uses TailwindCSS class (e.g., bg-primary)
3. TailwindCSS generates CSS: background-color: var(--color-primary)
4. Browser resolves CSS variable based on active theme class
5. Rendered element displays correct color
```

## Data Persistence

### localStorage Schema

**Key**: `aurora-theme-preference`

**Value** (JSON):

```json
{
  "theme": "light" | "dark",
  "source": "localStorage",
  "timestamp": 1729728000000
}
```

**Size**: ~60-80 bytes

**Lifetime**: Persistent until cleared by user or browser

## Data Validation

### CSS Token Validation (Build-time, optional)

- Parse all CSS files in `src/styles/tokens/`
- Extract token definitions (`:root` and `.dark` selectors)
- Validate token naming conventions
- Check for duplicate token names
- Verify all tokens referenced in TailwindCSS config are defined
- Validate color contrast ratios (WCAG AA)

### Runtime Validation (Development Mode)

- Detect usage of undefined tokens (magenta fallback values)
- Log console warnings with token name and component location
- Visual error indicators on affected elements

## Schema Evolution

Design tokens are defined in CSS, not in data files, so schema evolution primarily affects:

1. **Adding new tokens**: Add to appropriate CSS file, extend TailwindCSS config
2. **Renaming tokens**: Find/replace across CSS and component files
3. **Removing tokens**: Delete from CSS, remove from TailwindCSS config, update components
4. **Changing token values**: Update in CSS file (light and/or dark theme)

No migration scripts required - CSS changes are applied at build time.

## Performance Considerations

- **Token count**: 50-100 tokens = ~2-5KB CSS (minimal impact)
- **Theme switching**: Single class toggle + browser repaint (~50-100ms)
- **localStorage**: Synchronous read on init (<1ms)
- **CSS variable resolution**: Native browser feature (zero overhead)

## Example Token Set (Minimal)

```css
/* Base colors */
:root {
  /* Primary colors */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;

  /* Semantic colors */
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #06b6d4;

  /* Text colors */
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --color-text-disabled: #9ca3af;

  /* Background colors */
  --color-bg-base: #ffffff;
  --color-bg-elevated: #f9fafb;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-weight-normal: 400;
  --font-weight-bold: 700;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Borders */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Transitions */
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
}

/* Dark theme overrides */
.dark {
  --color-primary: #60a5fa;
  --color-secondary: #a78bfa;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-bg-base: #1f2937;
  --color-bg-elevated: #374151;
}
```

## Conclusion

The design system's data model is intentionally lightweight, with most "data" being CSS custom properties defined in stylesheets. The only runtime data structure is the theme preference stored in localStorage. This approach aligns with the static-only constitution and ensures zero build-time or runtime overhead.
