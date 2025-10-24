# Quickstart: Design System with Global Theme Tokens

**Feature**: 003-design-system-tokens  
**Last Updated**: 2025-10-24

## Overview

This guide helps you quickly understand and use the Aurora Complex design system. The design system provides centralized control over all visual styling through design tokens (CSS custom properties).

## For Developers

### Using Design Tokens

Design tokens are accessed through TailwindCSS utility classes. Instead of hard-coding colors or spacing values, use the semantic token classes:

```tsx
// ✅ Good - Uses design tokens
<button className="bg-primary text-white px-md py-sm rounded-md shadow-sm">
  Click Me
</button>

// ❌ Bad - Hard-coded values
<button className="bg-blue-500 text-white px-4 py-2 rounded shadow-sm">
  Click Me
</button>
```

### Available Token Categories

1. **Colors**: `bg-primary`, `text-secondary`, `border-default`
2. **Spacing**: `px-xs`, `m-md`, `gap-lg`
3. **Typography**: `text-sm`, `font-bold`, `leading-tight`
4. **Shadows**: `shadow-sm`, `shadow-md`, `shadow-lg`
5. **Borders**: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`
6. **Transitions**: `duration-fast`, `duration-base`, `duration-slow`

### Theme Switching

The app supports light and dark themes:

```tsx
import { useTheme } from "@/hooks/useTheme";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return <button onClick={toggleTheme}>Current theme: {theme}</button>;
}
```

### Creating New Components

1. Use TailwindCSS classes that reference design tokens
2. Never hard-code color values, spacing, or other visual properties
3. Test your component in both light and dark themes

```tsx
// Example component using design tokens
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-elevated border border-default rounded-md shadow-md p-lg">
      {children}
    </div>
  );
}
```

### Checking for Invalid Token Usage

In development mode, if you reference a non-existent token, affected elements will display with a magenta color (error indicator) and warnings will appear in the console.

```tsx
// This will show magenta if --color-invalid doesn't exist
<div className="bg-[var(--color-invalid)]">Invalid token</div>
```

## For Designers

### Viewing All Tokens

Visit the design system reference page (when implemented in P3) to see all available tokens with visual examples.

### Changing Token Values

To change a design token value:

1. Open the relevant CSS file in `src/styles/tokens/`
   - Colors: `colors.css`
   - Spacing: `spacing.css`
   - Typography: `typography.css`
   - Shadows: `shadows.css`
   - Borders: `borders.css`
   - Transitions: `transitions.css`
2. Update the CSS custom property value:

   ```css
   /* src/styles/tokens/colors.css */
   :root {
     --color-primary: #3b82f6; /* Change this value */
   }

   .dark {
     --color-primary: #60a5fa; /* Dark theme variant */
   }
   ```

3. Save the file - changes appear instantly in dev mode
4. Rebuild for production: `npm run build`

### Adding New Tokens

Follow these steps:

1. Open the appropriate token category CSS file
2. Add the new token following naming conventions:

   ```css
   /* Pattern: --{category}-{property}-{variant?} */
   --color-accent: #f59e0b;
   --spacing-2xs: 0.125rem;
   --font-size-xs: 0.75rem;
   ```

3. Add the token to TailwindCSS config if it needs utility classes:

   ```javascript
   // tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         colors: {
           accent: "var(--color-accent)",
         },
         spacing: {
           "2xs": "var(--spacing-2xs)",
         },
       },
     },
   };
   ```

## Common Tasks

### Change Primary Brand Color

1. Edit `src/styles/tokens/colors.css`
2. Update `--color-primary` in both `:root` (light) and `.dark` (dark)
3. Save and verify changes across the app

### Add a New Spacing Size

1. Edit `src/styles/tokens/spacing.css`
2. Add new token: `--spacing-{size}: {value};`
3. Update `tailwind.config.js` to expose as utility class
4. Use in components: `<div className="p-{size}">`

### Create a Custom Shadow

1. Edit `src/styles/tokens/shadows.css`
2. Add new token: `--shadow-{name}: {css-shadow-value};`
3. Update TailwindCSS config if needed
4. Use in components: `<div className="shadow-{name}">`

### Switch Theme Programmatically

```typescript
import { useTheme } from "@/hooks/useTheme";

function MyComponent() {
  const { theme, setTheme } = useTheme();

  // Force light theme
  setTheme("light");

  // Force dark theme
  setTheme("dark");

  // Follow OS preference
  setTheme("system");
}
```

## File Structure

```text
src/styles/tokens/
├── colors.css        # All color tokens
├── spacing.css       # Spacing scale (xs, sm, md, lg, xl)
├── typography.css    # Font sizes, weights, line heights
├── shadows.css       # Shadow elevation levels
├── borders.css       # Border radius values
├── transitions.css   # Animation durations
└── themes/
    ├── light.css     # Light theme token values (default)
    └── dark.css      # Dark theme overrides
```

## Best Practices

### ✅ Do

- Use semantic token names (`color-primary`, not `color-blue`)
- Test changes in both light and dark themes
- Use TailwindCSS utility classes that reference tokens
- Check console for token warnings during development
- Document new tokens with comments in CSS files

### ❌ Don't

- Hard-code color hex values in components
- Use arbitrary pixel values for spacing (use token scale)
- Create tokens that are too specific to one component
- Forget to update both light and dark theme variants
- Use implementation-specific names (`color-react-button`)

## Testing

### Visual Testing

1. Make token changes
2. Run `npm run dev`
3. Visit all pages and check:
   - Colors are consistent
   - Spacing looks correct
   - Shadows appear as expected
   - Typography is readable

### Theme Switching Testing

1. Toggle between light and dark themes
2. Verify all colors update appropriately
3. Check that theme preference persists on page reload
4. Test with OS theme preference changes

## Troubleshooting

### Problem: Token changes don't appear

**Solution**: Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)

### Problem: Magenta colors appearing

**Solution**: Check console for token name warnings. Either add the missing token or fix the typo in your component.

### Problem: Theme doesn't persist

**Solution**: Check browser console for localStorage errors. Ensure localStorage is not blocked.

### Problem: Wrong colors in dark theme

**Solution**: Verify you've defined dark theme overrides in `src/styles/tokens/themes/dark.css`

## Resources

- [Feature Specification](./spec.md)
- [Data Model](./data-model.md)
- [Research Document](./research.md)
- [Implementation Plan](./plan.md)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

## Quick Reference: Token Naming Patterns

| Category    | Pattern                       | Example                                     |
| ----------- | ----------------------------- | ------------------------------------------- |
| Colors      | `--color-{purpose}`           | `--color-primary`, `--color-text-secondary` |
| Spacing     | `--spacing-{size}`            | `--spacing-xs`, `--spacing-md`              |
| Typography  | `--font-{property}-{variant}` | `--font-size-lg`, `--font-weight-bold`      |
| Shadows     | `--shadow-{size}`             | `--shadow-sm`, `--shadow-md`                |
| Borders     | `--radius-{size}`             | `--radius-sm`, `--radius-lg`                |
| Transitions | `--duration-{speed}`          | `--duration-fast`, `--duration-slow`        |

## Support

For questions or issues with the design system, check:

1. Console warnings (development mode)
2. This quickstart guide
3. [Feature specification](./spec.md) for requirements
4. [Data model](./data-model.md) for token structure
