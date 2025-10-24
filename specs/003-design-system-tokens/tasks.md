---
description: "Task list for Design System with Global Theme Tokens implementation"
---

# Tasks: Design System with Global Theme Tokens

**Input**: Design documents from `/specs/003-design-system-tokens/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested - focusing on implementation and manual testing

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Static web app structure:

- `public/` - Static assets
- `src/` - Source files
- `src/styles/tokens/` - Design token definitions
- `dist/` - Build output

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and token infrastructure setup

- [x] T001 Create design token directory structure at src/styles/tokens/ with subdirectories for colors.css, spacing.css, typography.css, shadows.css, borders.css, transitions.css, and themes/ folder
- [x] T002 [P] Create themes subdirectory at src/styles/tokens/themes/ for light.css and dark.css theme variants
- [x] T003 [P] Review existing component files in src/components/ to identify hard-coded values that need migration to tokens

**T003 FINDINGS:**

**Colors (High Priority Migration):**

- Primary: `emerald-500`, `emerald-400`, `emerald-300` (buttons, links, focus states)
- Backgrounds: `slate-950`, `slate-900`, `slate-800` (pages, cards)
- Surfaces: `slate-900/80`, `slate-900/60` (panels with opacity)
- Text: `slate-100`, `slate-400`, `slate-300` (primary, secondary, tertiary)
- Borders: `slate-700`, `slate-700/50` (cards, inputs)
- Error: `red-500`, `red-400`, `red-900/10` (error states)
- Hex in index.css: `#0f172a`, `#f8fafc`, `#34d399`

**Spacing**: `gap-2/3/4/6`, `p-2/3/4/5/6/8`, `px-3/4/5`, `py-2/2.5/3`

**Shadows**: `shadow-lg`, `shadow-xl`, `shadow-emerald-500/10`, `shadow-slate-950/50`

**Borders**: `rounded-md/lg/xl/2xl/full`, `border/border-2/border-4`

**Priority Components for Phase 3:**

1. SearchPanel.tsx (11+ color classes)
2. UnitList.tsx (15+ color classes)
3. ModelList.tsx (10+ color classes)
4. BrowseModelsButton.tsx (6+ color classes)
5. BackNav.tsx (5+ color classes)
6. Tooltip.tsx (6+ color classes)
7. src/styles/index.css (3 hex colors)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core token infrastructure and theme management that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create ThemeContext.tsx in src/contexts/ with theme state management (light/dark/system modes)
- [x] T005 Create useTheme hook in src/hooks/useTheme.ts with toggleTheme, setTheme, and theme getter functions
- [x] T006 Create theme utility functions in src/utils/theme.ts for localStorage persistence (key: aurora-theme-preference) and OS preference detection
- [x] T007 Update src/main.tsx to wrap app with ThemeProvider and initialize theme on app load
- [x] T008 Add inline theme detection script to index.html head section to prevent flash of wrong theme (check localStorage, apply class before render)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Centralized Theme Management (Priority: P1) 🎯 MVP

**Goal**: Implement centralized color token system with light/dark theme support so changing the primary color token updates all UI elements automatically

**Independent Test**: Change --color-primary value in src/styles/tokens/colors.css and verify that all buttons, links, and headings update automatically across all pages in both light and dark themes

### Implementation for User Story 1

- [x] T009 [P] [US1] Define base color palette in src/styles/tokens/colors.css with CSS custom properties for primary, secondary, neutral-50 through neutral-950, brand colors
- [x] T010 [P] [US1] Define semantic color tokens in src/styles/tokens/colors.css including success, error, warning, info colors
- [x] T011 [P] [US1] Define contextual color tokens in src/styles/tokens/colors.css for text (primary, secondary, disabled), backgrounds (base, elevated, overlay), and borders (default, focus)
- [x] T012 [US1] Create light theme variant in src/styles/tokens/themes/light.css with :root selector defining all color token values for light mode
- [x] T013 [US1] Create dark theme variant in src/styles/tokens/themes/dark.css with .dark selector defining all color token overrides for dark mode with adjusted values
- [x] T014 [US1] Update tailwind.config.js to extend theme.colors with references to color tokens using var(--color-primary), var(--color-secondary), etc.
- [x] T015 [US1] Import color token CSS files in src/styles/index.css in correct order (colors.css, then themes/light.css, then themes/dark.css)
- [x] T016 [US1] Update App.tsx to apply theme class to html element based on useTheme hook state
- [x] T017 [US1] Implement theme toggle button component in src/components/ThemeToggle.tsx using useTheme hook
- [x] T018 [US1] Migrate existing Button component in src/components/ to use bg-primary, text-white, and other token-based classes instead of hard-coded colors
- [x] T019 [US1] Migrate existing navigation components to use color tokens (text-primary, text-secondary, bg-elevated)
- [x] T020 [US1] Migrate page header/footer components to use color tokens
- [x] T021 [US1] Add development-only error handling: configure CSS fallback values (e.g., magenta) for invalid tokens in src/styles/tokens/colors.css
- [x] T022 [US1] Test theme switching works correctly, persists to localStorage, and respects OS preference on initial load

**Checkpoint**: At this point, User Story 1 should be fully functional - color tokens work, theme switching works, primary color changes propagate throughout the app

**COMPONENTS MIGRATED (T018-T020):**

- ✅ BackNav.tsx - All colors migrated to tokens
- ✅ BrowseModelsButton.tsx - All colors migrated to tokens
- ✅ Tooltip.tsx - All colors migrated to tokens
- ✅ UnitList.tsx - All colors migrated to tokens (including status badges)
- ✅ ModelList.tsx - All colors migrated to tokens
- ✅ SearchPanel.tsx - All colors migrated to tokens (forms, inputs, buttons)
- ✅ Global styles (index.css) - All hex colors replaced with tokens

---

## Phase 4: User Story 2 - Comprehensive Visual Token Coverage (Priority: P2)

**Goal**: Extend design system to cover all visual properties (spacing, typography, shadows, borders, transitions) so all UI components use tokens instead of hard-coded values

**Independent Test**: Audit codebase to verify zero hard-coded hex colors, px spacing values, or custom shadow definitions - all components use design tokens

### Implementation for User Story 2

- [x] T023 [P] [US2] Define spacing scale tokens in src/styles/tokens/spacing.css using 8-point grid (--spacing-xs: 0.25rem, --spacing-sm: 0.5rem, --spacing-md: 1rem, --spacing-lg: 1.5rem, --spacing-xl: 2rem, --spacing-2xl: 3rem, --spacing-3xl: 4rem)
- [x] T024 [P] [US2] Define typography tokens in src/styles/tokens/typography.css for font sizes (--font-size-xs through --font-size-3xl), weights (--font-weight-normal through --font-weight-bold), and line heights (--line-height-tight, --line-height-normal, --line-height-loose)
- [x] T025 [P] [US2] Define shadow tokens in src/styles/tokens/shadows.css with three elevation levels (--shadow-sm, --shadow-md, --shadow-lg) using rgba values
- [x] T026 [P] [US2] Define border radius tokens in src/styles/tokens/borders.css (--radius-sm: 0.25rem, --radius-md: 0.375rem, --radius-lg: 0.5rem, --radius-full: 9999px)
- [x] T027 [P] [US2] Define transition duration tokens in src/styles/tokens/transitions.css (--duration-fast: 150ms, --duration-base: 300ms, --duration-slow: 500ms)
- [x] T028 [US2] Update tailwind.config.js to extend theme.spacing with spacing token references (xs, sm, md, lg, xl, 2xl, 3xl)
- [x] T029 [US2] Update tailwind.config.js to extend theme.fontSize with typography size token references
- [x] T030 [US2] Update tailwind.config.js to extend theme.fontWeight with typography weight token references
- [x] T031 [US2] Update tailwind.config.js to extend theme.boxShadow with shadow token references (sm, md, lg)
- [x] T032 [US2] Update tailwind.config.js to extend theme.borderRadius with radius token references (sm, md, lg, full)
- [x] T033 [US2] Update tailwind.config.js to extend theme.transitionDuration with duration token references (fast, base, slow)
- [x] T034 [US2] Import all token CSS files in src/styles/index.css (spacing.css, typography.css, shadows.css, borders.css, transitions.css)
- [x] T035 [US2] Migrate Card component in src/components/ to use spacing tokens (p-lg, m-md), shadow tokens (shadow-md), and border radius tokens (rounded-md)
- [ ] T036 [US2] Migrate Modal/Dialog components to use spacing and shadow tokens
- [x] T037 [US2] Migrate form input components to use spacing, border radius, and transition duration tokens
- [ ] T038 [US2] Migrate typography components (headings, paragraphs) to use font size, weight, and line height tokens
- [x] T039 [US2] Audit all components in src/components/ for hard-coded values and replace with appropriate tokens
- [x] T040 [US2] Update existing page layouts to use spacing tokens instead of hard-coded margin/padding values
- [x] T041 [US2] Verify all animations use transition duration tokens (duration-fast, duration-base, duration-slow)
- [ ] T042 [US2] Run visual consistency audit across all pages to verify uniform spacing, shadows, and borders

**Checkpoint**: All user stories should work independently - comprehensive token coverage achieved, no hard-coded visual values remain

**COMPONENTS MIGRATED (T035, T037, T039):**

- ✅ UnitList.tsx - Migrated to spacing (gap-md, p-md, mb-sm, space-y-xs), border radius (rounded-card, rounded-badge), transitions (transition-hover, transition-color)
- ✅ ModelList.tsx - Migrated to spacing (gap-lg, p-md, gap-xs, mb-sm), border radius (rounded-card, rounded-badge), shadows (shadow-card-hover, shadow-elevated), transitions (transition-hover, transition-color, transition-transform duration-base ease-out)
- ✅ SearchPanel.tsx - Migrated to spacing (p-lg, mb-md, mb-lg, gap-md, gap-sm, px-sm), border radius (rounded-card, rounded-input, rounded-button), shadows (shadow-elevated), transitions (transition-focus, transition-hover)
- ✅ BackNav.tsx - Migrated to spacing (gap-sm, px-md, py-sm), border radius (rounded-badge), transitions (transition-hover)
- ✅ BrowseModelsButton.tsx - Migrated to spacing (px-md, py-sm), border radius (rounded-badge), transitions (transition-hover)
- ✅ Tooltip.tsx - Migrated to spacing (px-md, py-sm, mt-xs), border radius (rounded-tooltip), shadows (shadow-tooltip)
- ✅ ThemeToggle.tsx - Migrated to spacing (p-sm), border radius (rounded-button), transitions (transition-hover, transition-color)

**PAGES MIGRATED (T040, T041):**

- ✅ UnitsView.tsx - Migrated to spacing (py-2xl, mb-md, gap-lg, p-lg), border radius (rounded-card)
- ✅ MasterPlanView.tsx - Complete migration with all design tokens (spacing: p-lg, gap-md, gap-sm, px-md, py-sm, px-lg, py-sm, mb-lg, mb-md; typography: text-heading-1, text-caption; colors: text-primary, text-text-secondary, text-text-tertiary; borders: rounded-badge, rounded-card; shadows: shadow-elevated, shadow-modal; transitions: transition-hover, duration-base)
- ✅ ModelView.tsx - Complete migration with design tokens (spacing: p-lg, gap-md, gap-sm, px-md, py-sm, mt-sm, mt-md; typography: text-heading-1, text-caption; colors: text-primary, text-text-secondary, text-text-inverse; borders: rounded-badge; shadows: shadow-elevated; transitions: transition-hover)
- ✅ BuildingView.tsx - Complete migration with design tokens (spacing: p-lg, p-xl, gap-lg, gap-md, gap-sm, px-lg, py-md, mb-lg; typography: text-heading-3; borders: rounded-card, rounded-button, rounded-badge; shadows: shadow-elevated, shadow-modal; transitions: transition-hover)
- ✅ FloorPlanView.tsx - Complete migration with design tokens (spacing: p-lg, sm:p-xl, gap-lg, gap-md, gap-sm, px-lg, py-sm, px-sm, py-xs, mt-lg, mt-sm, mt-xs, space-y-sm, mb-lg, py-2xl, mb-md; typography: text-heading-1, text-heading-3, text-caption; colors: text-primary, text-text-secondary, text-text-tertiary, text-error, text-text-inverse, text-text-disabled; borders: rounded-card, rounded-badge, rounded-button; shadows: shadow-elevated, shadow-modal; transitions: transition-hover)
- ✅ MapView.tsx - Complete migration with design tokens (spacing: p-lg, p-sm, gap-md, gap-sm, gap-xs, space-y-md, px-lg, py-sm, mb-sm, mb-xs; typography: text-heading-1, text-caption; colors: text-primary, text-text-primary, text-text-secondary, text-text-tertiary; borders: rounded-card, rounded-badge; shadows: shadow-elevated, shadow-tooltip)
- ✅ TourViewer.tsx - Complete migration with design tokens (spacing: px-lg, py-lg, px-md, py-sm, py-md, gap-sm, gap-xs, p-md, p-sm; typography: text-heading-3; colors: text-primary, text-text-primary, text-text-secondary, text-text-tertiary, text-error, text-text-inverse, text-primary-light; borders: rounded-badge, rounded-card, rounded-button; shadows: shadow-elevated, shadow-modal, shadow-tooltip; transitions: transition-hover)

---

## Phase 5: User Story 3 - Theme Documentation and Discovery (Priority: P3)

**Goal**: Create design token reference documentation so new developers can discover available tokens and understand how to use them

**Independent Test**: Provide only the documentation to a new developer and verify they can correctly implement a new component using design tokens without additional help

### Implementation for User Story 3

- [ ] T043 [P] [US3] Create DesignSystemPage component in src/pages/DesignSystemPage.tsx with route /design-system for token reference
- [ ] T044 [P] [US3] Create TokenCategory component in src/components/TokenCategory.tsx to display token groups with descriptions
- [ ] T045 [P] [US3] Create ColorSwatch component in src/components/ColorSwatch.tsx to visually display color tokens with hex values
- [ ] T046 [P] [US3] Create SpacingDemo component in src/components/SpacingDemo.tsx to show spacing scale with visual boxes
- [ ] T047 [P] [US3] Create TypographyDemo component in src/components/TypographyDemo.tsx to display font size/weight/line-height samples
- [ ] T048 [P] [US3] Create ShadowDemo component in src/components/ShadowDemo.tsx to show shadow elevation levels on cards
- [ ] T049 [P] [US3] Create BorderRadiusDemo component in src/components/BorderRadiusDemo.tsx to display border radius variations
- [ ] T050 [P] [US3] Create TransitionDemo component in src/components/TransitionDemo.tsx to show animation duration differences interactively
- [ ] T051 [US3] Add route for /design-system in src/routes/index.tsx mapping to DesignSystemPage
- [ ] T052 [US3] Implement color token section in DesignSystemPage showing all color categories (primary, secondary, semantic, contextual) with ColorSwatch components
- [ ] T053 [US3] Implement spacing token section in DesignSystemPage with SpacingDemo showing all spacing scales
- [ ] T054 [US3] Implement typography token section in DesignSystemPage with TypographyDemo showing all font sizes, weights, and line heights
- [ ] T055 [US3] Implement shadow token section in DesignSystemPage with ShadowDemo showing all elevation levels
- [ ] T056 [US3] Implement border radius token section in DesignSystemPage with BorderRadiusDemo showing all radius values
- [ ] T057 [US3] Implement transition token section in DesignSystemPage with TransitionDemo showing all durations
- [ ] T058 [US3] Add code snippet examples to DesignSystemPage showing how to use tokens in components (with TailwindCSS classes)
- [ ] T059 [US3] Add theme toggle to DesignSystemPage to preview tokens in both light and dark modes
- [ ] T060 [US3] Add navigation link to design system page in main navigation menu
- [ ] T061 [US3] Update quickstart.md with link to design system reference page
- [ ] T062 [US3] Test that design system page accurately displays all tokens and updates correctly when theme is toggled

**Checkpoint**: All user stories complete - comprehensive design system with documentation is fully functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, validation, and documentation

- [ ] T063 [P] Add JSDoc comments to useTheme hook documenting all functions and return values
- [ ] T064 [P] Add JSDoc comments to theme utility functions in src/utils/theme.ts
- [ ] T065 [P] Update README.md with design system overview and link to token reference page
- [ ] T066 [P] Run ESLint across all modified files and fix any linting errors
- [ ] T067 Verify all color tokens meet WCAG AA contrast ratio requirements (4.5:1 for text, 3:1 for UI components)
- [ ] T068 Test theme switching performance is under 100ms target
- [ ] T069 Verify theme preference persists correctly across browser sessions using localStorage
- [ ] T070 Test OS preference detection works correctly on initial load (light/dark/no preference)
- [ ] T071 Verify invalid token references display magenta in development mode with console warnings
- [ ] T072 Test design system in all target browsers (Chrome, Firefox, Safari, Edge)
- [ ] T073 Run production build (npm run build) and verify dist/ output is complete
- [ ] T074 Test production build locally with npm run preview
- [ ] T075 Validate quickstart.md instructions by following them step-by-step
- [ ] T076 [P] Create PR description documenting design system implementation and migration guide

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories. Focuses on color tokens and theme switching.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 by adding non-color tokens. Can work independently but builds on color system from US1.
- **User Story 3 (P3)**: Should start after US1 and US2 are complete - Documents all tokens created in previous stories.

### Within Each User Story

**User Story 1 (Color Tokens & Theme Switching)**:

1. Define color tokens (T009-T011) → Create theme variants (T012-T013) → Update TailwindCSS (T014) → Import CSS (T015) → Implement theme management (T016-T017) → Migrate components (T018-T020) → Add error handling (T021) → Test (T022)

**User Story 2 (Comprehensive Token Coverage)**:

1. Define all token categories in parallel (T023-T027) → Update TailwindCSS config in parallel (T028-T033) → Import CSS (T034) → Migrate components (T035-T041) → Audit (T042)

**User Story 3 (Documentation)**:

1. Create demo components in parallel (T043-T049) → Add route (T050-T051) → Implement page sections (T052-T058) → Add navigation (T059-T061) → Test (T062)

### Parallel Opportunities

- **Setup (Phase 1)**: T002 and T003 can run in parallel
- **Foundational (Phase 2)**: All tasks are sequential (theme context → hook → utils → app integration)
- **User Story 1**: T009, T010, T011 can run in parallel (different token categories). T018, T019, T020 can run in parallel (different components)
- **User Story 2**: T023-T027 can run in parallel (different CSS files). T028-T033 can run in parallel (different TailwindCSS config sections). T035-T038 can run in parallel (different components)
- **User Story 3**: T043-T049 can run in parallel (different demo components). T052-T057 can run in parallel (different page sections)
- **Polish (Phase 6)**: T063, T064, T065, T066 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Launch color token definitions in parallel:
Task: "Define base color palette in src/styles/tokens/colors.css"
Task: "Define semantic color tokens in src/styles/tokens/colors.css"
Task: "Define contextual color tokens in src/styles/tokens/colors.css"

# Later, migrate components in parallel:
Task: "Migrate Button component to use token-based classes"
Task: "Migrate navigation components to use color tokens"
Task: "Migrate page header/footer to use color tokens"
```

## Parallel Example: User Story 2

```bash
# Launch all token category definitions in parallel:
Task: "Define spacing scale tokens in src/styles/tokens/spacing.css"
Task: "Define typography tokens in src/styles/tokens/typography.css"
Task: "Define shadow tokens in src/styles/tokens/shadows.css"
Task: "Define border radius tokens in src/styles/tokens/borders.css"
Task: "Define transition duration tokens in src/styles/tokens/transitions.css"

# Launch TailwindCSS config updates in parallel:
Task: "Update tailwind.config.js spacing extension"
Task: "Update tailwind.config.js fontSize extension"
Task: "Update tailwind.config.js fontWeight extension"
Task: "Update tailwind.config.js boxShadow extension"
Task: "Update tailwind.config.js borderRadius extension"
Task: "Update tailwind.config.js transitionDuration extension"
```

## Parallel Example: User Story 3

```bash
# Launch all demo components in parallel:
Task: "Create ColorSwatch component"
Task: "Create SpacingDemo component"
Task: "Create TypographyDemo component"
Task: "Create ShadowDemo component"
Task: "Create BorderRadiusDemo component"
Task: "Create TransitionDemo component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008) - **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (T009-T022)
4. **STOP and VALIDATE**: Test theme switching, verify primary color changes propagate
5. Deploy/demo if ready - **This is a functional MVP with color tokens and theme switching**

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T008)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - color tokens work!)
3. Add User Story 2 → Test independently → Deploy/Demo (Complete token system!)
4. Add User Story 3 → Test independently → Deploy/Demo (Fully documented!)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T008)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T009-T022) - Color tokens & theme switching
   - **Developer B**: User Story 2 (T023-T042) - Comprehensive token coverage (can start after US1 color tokens are defined)
   - **Developer C**: User Story 3 (T043-T062) - Documentation (should wait for US1 + US2 to complete)
3. Stories integrate naturally since US2 extends US1 and US3 documents both

---

## Task Summary

**Total Tasks**: 76

**By Phase**:

- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 5 tasks
- Phase 3 (User Story 1 - P1): 14 tasks
- Phase 4 (User Story 2 - P2): 20 tasks
- Phase 5 (User Story 3 - P3): 20 tasks
- Phase 6 (Polish): 14 tasks

**By User Story**:

- User Story 1 (Centralized Theme Management): 14 tasks
- User Story 2 (Comprehensive Token Coverage): 20 tasks
- User Story 3 (Theme Documentation): 20 tasks
- Infrastructure (Setup + Foundational): 8 tasks
- Polish: 14 tasks

**Parallel Opportunities**: 35 tasks marked with [P] can run in parallel with others

**MVP Scope**: Phases 1-3 (T001-T022) = 22 tasks for functional color token system with theme switching

**Independent Test Criteria**:

- **US1**: Change primary color token value → All UI elements update automatically in both themes
- **US2**: Audit codebase → Zero hard-coded visual values found
- **US3**: Give documentation to new developer → They can build component with tokens successfully

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [US1], [US2], [US3] labels map tasks to specific user stories for traceability
- Each user story is independently completable and testable
- No explicit test files requested - using manual testing and visual validation
- Component migration is incremental - start with high-visibility components first
- Error handling (magenta indicators) only enabled in development mode
- Theme preference persists across sessions via localStorage
- WCAG AA color contrast validation required before completion
- Build output must be static (dist/) with no server-side processing
