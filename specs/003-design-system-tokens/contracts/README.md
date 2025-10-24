# Design System Contracts

This directory contains JSON schemas defining the structure of design system data.

## Schemas

### theme-preference.schema.json

Defines the structure of theme preference data stored in browser localStorage.

**Usage**: Validates theme preference object before saving to localStorage.

**Key**: `aurora-theme-preference`

### design-token.schema.json

Defines the structure of a design token (for documentation/tooling purposes).

**Usage**: If token metadata is generated for documentation, this schema validates the structure.

## Notes

- These schemas are primarily for documentation and optional validation
- The actual design tokens are defined as CSS custom properties in CSS files
- No runtime validation of CSS tokens occurs (browser handles invalid CSS gracefully)
- TypeScript types for theme management can be derived from these schemas
