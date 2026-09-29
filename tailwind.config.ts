import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213D",
        paper: "#F7F7F5",
        hairline: "#DADAD5",
        excellent: "#B8860B",
        good: "#2C5F8A",
        average: "#C1793C",
        poor: "#A6432D",
        // These now point at CSS variables (defined in globals.css) instead of
        // fixed hex values, so every bg-brand-*/text-brand-*/border-brand-*
        // class site-wide swaps automatically when data-theme flips between
        // "dark" (navy + teal) and "light" (white + neon blue).
        brand: {
          navy: "var(--brand-navy)",
          navyLight: "var(--brand-navy-light)",
          navySoft: "var(--brand-navy-soft)",
          border: "var(--brand-border)",
          teal: "var(--brand-teal)",
          text: "var(--brand-text)",
          muted: "var(--brand-muted)",
        },
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;