# Multilingual Feature - Implementation Guide

## 🌍 Overview

The project now supports multiple languages with full RTL (Right-to-Left) support. The implementation uses **react-i18next**, the industry-standard internationalization framework for React.

## ✅ What's Implemented

### 1. **Infrastructure**

- ✅ i18next configuration with language detection
- ✅ Browser language auto-detection
- ✅ LocalStorage persistence for user preference
- ✅ Namespace organization (common, navigation, pages, admin)
- ✅ HTTP backend for loading translation files

### 2. **Supported Languages**

- **English (en)** - Default, LTR
- **Arabic (ar)** - RTL support

### 3. **Components**

- ✅ `LanguageSwitcher` - Dropdown to switch languages
- ✅ `PageHeader` - Header with theme toggle and language switcher
- ✅ `useLanguage` hook - Custom hook for language utilities

### 4. **Migrated Components**

- ✅ `BackNav` - Navigation component
- ✅ `UnitsView` - Units browsing page
- ✅ `MapView` - Interactive map page

### 5. **RTL Support**

- ✅ Automatic direction detection
- ✅ CSS utilities for RTL layouts
- ✅ `dir` and `lang` attributes on `<html>`

## 📁 File Structure

```
src/
├── i18n/
│   ├── index.ts          # Main export
│   ├── config.ts         # i18next configuration
│   └── languages.ts      # Language definitions
├── components/
│   ├── LanguageSwitcher.tsx  # Language switcher dropdown
│   └── PageHeader.tsx        # Header with controls
├── hooks/
│   └── useLanguage.ts    # Language utilities hook
└── styles/
    └── index.css         # RTL CSS utilities

public/
└── locales/
    ├── en/
    │   ├── common.json      # Common UI strings
    │   ├── navigation.json  # Navigation strings
    │   ├── pages.json       # Page content
    │   └── admin.json       # Admin content
    └── ar/
        ├── common.json
        ├── navigation.json
        ├── pages.json
        └── admin.json
```

## 🔧 Usage

### Using Translations in Components

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  // Single namespace
  const { t } = useTranslation("common");

  // Multiple namespaces
  const { t } = useTranslation(["common", "navigation"]);

  return (
    <div>
      <h1>{t("common:buttons.save")}</h1>
      <p>{t("navigation:backToMap")}</p>

      {/* With interpolation */}
      <p>{t("navigation:backTo", { destination: "Home" })}</p>
    </div>
  );
}
```

### Using the Language Hook

```tsx
import { useLanguage } from "../hooks/useLanguage";

function MyComponent() {
  const { language, direction, isRtl, changeLanguage } = useLanguage();

  return (
    <div dir={direction}>
      <p>Current language: {language}</p>
      <button onClick={() => changeLanguage("ar")}>Switch to Arabic</button>
    </div>
  );
}
```

### Adding the Language Switcher

```tsx
import { LanguageSwitcher } from "../components/LanguageSwitcher";

function MyPage() {
  return (
    <div>
      <header>
        <LanguageSwitcher />
      </header>
      {/* Rest of your page */}
    </div>
  );
}
```

## 📝 Translation Key Naming Convention

Use the format: `namespace:section.key`

**Examples:**

- `common:buttons.save`
- `common:status.loading`
- `navigation:backToMap`
- `pages:unitsView.title`
- `admin:dashboard.welcome`

## 🎨 RTL CSS Utilities

```css
/* Mirror elements (icons, arrows) for RTL */
<div className="rtl-mirror">→</div>

/* Flip flex direction for RTL */
<div className="flex rtl-flip">
  <span>First</span>
  <span>Second</span>
</div>
```

## ➕ Adding a New Language

### Step 1: Update Language Definitions

Edit `src/i18n/languages.ts`:

```typescript
export type LanguageCode = "en" | "ar" | "fr"; // Add "fr"

export const LANGUAGES: Record<LanguageCode, Language> = {
  en: {
    /* ... */
  },
  ar: {
    /* ... */
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    direction: "ltr",
  },
};
```

### Step 2: Update i18n Config

Edit `src/i18n/config.ts`:

```typescript
supportedLngs: ["en", "ar", "fr"], // Add "fr"
```

### Step 3: Create Translation Files

Create `public/locales/fr/` directory with:

- `common.json`
- `navigation.json`
- `pages.json`
- `admin.json`

Copy structure from English files and translate.

### Step 4: Test

Restart dev server and test language switching.

## 🔄 Adding Translations to Existing Components

### Before:

```tsx
<h1>Browse Units</h1>
<p>Filter and explore available units</p>
```

### After:

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('pages');

<h1>{t('unitsView.title')}</h1>
<p>{t('unitsView.subtitle')}</p>
```

## 🌐 Translation Files

Translation files are loaded dynamically from `public/locales/{lang}/{namespace}.json`.

**Example** (`public/locales/en/common.json`):

```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "status": {
    "loading": "Loading...",
    "error": "Error"
  }
}
```

## 🎯 Best Practices

1. **Always use namespaces** - Organize translations logically
2. **Extract all hardcoded strings** - Even single words
3. **Use interpolation** - For dynamic content: `t('key', { value })`
4. **Provide context** - Use clear, descriptive keys
5. **Test RTL layouts** - Especially with Arabic
6. **Keep translations synced** - All languages should have same keys

## 🚀 Next Steps

### Priority Components to Migrate:

- [ ] SearchPanel
- [ ] ModelList
- [ ] BrowseModelsButton
- [ ] Tooltip
- [ ] BuildingView
- [ ] FloorPlanView
- [ ] TourViewer
- [ ] ModelView
- [ ] MasterPlanView

### Admin Dashboard:

- [ ] All admin components
- [ ] All editor panels
- [ ] Form labels and buttons
- [ ] Error messages

### Data Localization:

- [ ] Add multilingual fields to JSON data files
- [ ] Update data loaders to return localized content
- [ ] Create admin UI for managing translations

## 🐛 Troubleshooting

### Translations Not Loading

- Check console for 404 errors
- Verify file paths in `public/locales/`
- Ensure namespace is loaded in i18n config

### RTL Layout Issues

- Use logical CSS properties (`margin-inline-start` instead of `margin-left`)
- Add `rtl-flip` class to flex containers
- Test with Arabic language selected

### Language Not Persisting

- Check browser LocalStorage for `i18nextLng` key
- Verify LanguageDetector is configured correctly

## 📚 Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [RTL Styling Guide](https://rtlstyling.com/)

---

**Branch:** `005-multilingual-i18n`
**Last Updated:** October 28, 2025
