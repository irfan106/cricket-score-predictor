import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "hsl(var(--paper) / <alpha-value>)",
        ink: "hsl(var(--ink) / <alpha-value>)",
        pitch: "hsl(var(--pitch) / <alpha-value>)",
        boundary: "hsl(var(--boundary) / <alpha-value>)",
        crease: "hsl(var(--crease) / <alpha-value>)",
        mist: "hsl(var(--mist) / <alpha-value>)",
      },
      boxShadow: {
        card: "0 20px 60px rgba(31, 45, 27, 0.12)",
      },
      fontFamily: {
        display: ["'Manrope'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
