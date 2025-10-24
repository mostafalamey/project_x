/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary/Brand Colors
        primary: {
          DEFAULT: "rgba(var(--color-primary-rgb), <alpha-value>)",
          hover: "var(--color-primary-hover)",
          muted: "var(--color-primary-muted)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          hover: "var(--color-secondary-hover)",
        },

        // Semantic Colors
        success: {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          bg: "var(--color-warning-bg)",
        },
        error: {
          DEFAULT: "rgba(var(--color-error-rgb), <alpha-value>)",
          bg: "var(--color-error-bg)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          bg: "var(--color-info-bg)",
        },

        // Contextual Colors
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          disabled: "var(--color-text-disabled)",
          inverse: "var(--color-text-inverse)",
          accent: "var(--color-text-accent)",
        },
        bg: {
          base: "var(--color-bg-base)",
          elevated: "var(--color-bg-elevated)",
          overlay: "var(--color-bg-overlay)",
          card: "var(--color-bg-card)",
          hover: "var(--color-bg-hover)",
          input: "var(--color-bg-input)",
        },
        border: {
          DEFAULT: "var(--color-border-default)",
          light: "var(--color-border-light)",
          muted: "var(--color-border-muted)",
          focus: "var(--color-border-focus)",
          hover: "var(--color-border-hover)",
        },
        surface: {
          base: "rgba(var(--color-surface-base-rgb), <alpha-value>)",
          elevated: "rgba(var(--color-surface-elevated-rgb), <alpha-value>)",
          hover: "rgba(var(--color-surface-hover-rgb), <alpha-value>)",
        },

        // Status-specific colors
        status: {
          available: {
            bg: "var(--color-status-available-bg)",
            text: "var(--color-status-available-text)",
            border: "var(--color-status-available-border)",
          },
          reserved: {
            bg: "var(--color-status-reserved-bg)",
            text: "var(--color-status-reserved-text)",
            border: "var(--color-status-reserved-border)",
          },
          sold: {
            bg: "var(--color-status-sold-bg)",
            text: "var(--color-status-sold-text)",
            border: "var(--color-status-sold-border)",
          },
        },

        // Focus ring
        focus: {
          ring: "var(--color-focus-ring)",
        },
      },

      // Spacing scale
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        base: "var(--spacing-base)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
        "3xl": "var(--spacing-3xl)",
        "4xl": "var(--spacing-4xl)",
        "5xl": "var(--spacing-5xl)",
        // Component-specific spacing
        "container-xs": "var(--spacing-container-xs)",
        "container-sm": "var(--spacing-container-sm)",
        "container-md": "var(--spacing-container-md)",
        "container-lg": "var(--spacing-container-lg)",
        "section-sm": "var(--spacing-section-sm)",
        "section-md": "var(--spacing-section-md)",
        "section-lg": "var(--spacing-section-lg)",
        "card-sm": "var(--spacing-card-sm)",
        "card-md": "var(--spacing-card-md)",
        "card-lg": "var(--spacing-card-lg)",
        "stack-xs": "var(--spacing-stack-xs)",
        "stack-sm": "var(--spacing-stack-sm)",
        "stack-md": "var(--spacing-stack-md)",
        "stack-lg": "var(--spacing-stack-lg)",
      },

      // Typography
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
        "5xl": "var(--font-size-5xl)",
        "6xl": "var(--font-size-6xl)",
        // Semantic typography
        "heading-1": "var(--font-size-heading-1)",
        "heading-2": "var(--font-size-heading-2)",
        "heading-3": "var(--font-size-heading-3)",
        "heading-4": "var(--font-size-heading-4)",
        "heading-5": "var(--font-size-heading-5)",
        "heading-6": "var(--font-size-heading-6)",
        "body-lg": "var(--font-size-body-lg)",
        body: "var(--font-size-body)",
        "body-sm": "var(--font-size-body-sm)",
        label: "var(--font-size-label)",
        caption: "var(--font-size-caption)",
      },
      fontWeight: {
        normal: "var(--font-weight-normal)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },
      lineHeight: {
        tight: "var(--line-height-tight)",
        normal: "var(--line-height-normal)",
        relaxed: "var(--line-height-relaxed)",
        loose: "var(--line-height-loose)",
      },
      letterSpacing: {
        tighter: "var(--letter-spacing-tighter)",
        tight: "var(--letter-spacing-tight)",
        normal: "var(--letter-spacing-normal)",
        wide: "var(--letter-spacing-wide)",
        wider: "var(--letter-spacing-wider)",
        widest: "var(--letter-spacing-widest)",
      },
      fontFamily: {
        sans: "var(--font-family-sans)",
        mono: "var(--font-family-mono)",
      },

      // Shadows
      boxShadow: {
        none: "var(--shadow-none)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
        // Colored shadows
        "primary-sm": "var(--shadow-primary-sm)",
        "primary-md": "var(--shadow-primary-md)",
        "primary-lg": "var(--shadow-primary-lg)",
        "error-sm": "var(--shadow-error-sm)",
        "error-md": "var(--shadow-error-md)",
        "success-sm": "var(--shadow-success-sm)",
        // Semantic shadows
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        dropdown: "var(--shadow-dropdown)",
        modal: "var(--shadow-modal)",
        elevated: "var(--shadow-elevated)",
        focus: "var(--shadow-focus)",
        tooltip: "var(--shadow-tooltip)",
      },

      // Border radius
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
        // Semantic radius tokens
        button: "var(--radius-button)",
        "button-sm": "var(--radius-button-sm)",
        "button-lg": "var(--radius-button-lg)",
        input: "var(--radius-input)",
        card: "var(--radius-card)",
        panel: "var(--radius-panel)",
        badge: "var(--radius-badge)",
        tag: "var(--radius-tag)",
        modal: "var(--radius-modal)",
        tooltip: "var(--radius-tooltip)",
        avatar: "var(--radius-avatar)",
      },

      // Transitions
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        DEFAULT: "var(--duration-base)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
        slower: "var(--duration-slower)",
        slowest: "var(--duration-slowest)",
      },
      transitionTimingFunction: {
        linear: "var(--ease-linear)",
        DEFAULT: "var(--ease)",
        in: "var(--ease-in)",
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
        bounce: "var(--ease-bounce)",
        smooth: "var(--ease-smooth)",
        emphasized: "var(--ease-emphasized)",
      },
      transitionDelay: {
        none: "var(--delay-none)",
        fast: "var(--delay-fast)",
        base: "var(--delay-base)",
        slow: "var(--delay-slow)",
      },
    },
  },
  plugins: [],
};
