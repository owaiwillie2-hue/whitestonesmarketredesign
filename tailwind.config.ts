import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--navy-dark))",
          foreground: "hsl(var(--primary-foreground))",
          container: "#002b5b",
          fixed: "#d6e3ff",
          "fixed-dim": "#a9c7ff",
        },
        secondary: {
          DEFAULT: "#00629d",
          foreground: "hsl(var(--secondary-foreground))",
          container: "#00a2fd",
          fixed: "#cfe5ff",
          "fixed-dim": "#98cbff",
        },
        tertiary: {
          DEFAULT: "#001d06",
          container: "#003410",
          fixed: "#69ff87",
          "fixed-dim": "#3ce36a",
        },
        surface: {
          DEFAULT: "#f7f9ff",
          dim: "#c4ddf8",
          bright: "#f7f9ff",
          variant: "#cde5ff",
          tint: "#405f91",
          "container-lowest": "#ffffff",
          "container-low": "#edf4ff",
          container: "#e2efff",
          "container-high": "#d8eaff",
          "container-highest": "#cde5ff",
        },
        on: {
          primary: "#ffffff",
          "primary-container": "#7594ca",
          "primary-fixed": "#001b3d",
          "primary-fixed-variant": "#264778",
          secondary: "#ffffff",
          "secondary-container": "#003558",
          "secondary-fixed": "#001d33",
          "secondary-fixed-variant": "#004a77",
          tertiary: "#ffffff",
          "tertiary-container": "#00aa45",
          "tertiary-fixed": "#002108",
          "tertiary-fixed-variant": "#00531e",
          surface: "#011d31",
          "surface-variant": "#43474f",
          error: "#ffffff",
          "error-container": "#93000a",
          background: "#011d31",
        },
        inverse: {
          surface: "#193247",
          "on-surface": "#e8f2ff",
          primary: "#a9c7ff",
        },
        outline: {
          DEFAULT: "#747780",
          variant: "#c4c6d0",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      fontFamily: {
        "display-lg": ["Plus Jakarta Sans"],
        "body-lg": ["Plus Jakarta Sans"],
        "label-md": ["Inter"],
        "headline-md": ["Plus Jakarta Sans"],
        "body-md": ["Plus Jakarta Sans"],
        "data-mono": ["Inter"],
        "headline-lg": ["Plus Jakarta Sans"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "body-lg": ["18px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "1.2", letterSpacing: "0.04em", fontWeight: "500" }],
        "headline-md": ["24px", { lineHeight: "1.3", letterSpacing: "0.01em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
        "data-mono": ["16px", { lineHeight: "1.0", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "0.01em", fontWeight: "700" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
