import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // All bark/sand colors resolve from CSS variables so they
        // switch automatically between light and dark themes.
        sand: {
          50:  "rgb(var(--sand-50)  / <alpha-value>)",
          100: "rgb(var(--sand-100) / <alpha-value>)",
          200: "rgb(var(--sand-200) / <alpha-value>)",
          300: "rgb(var(--sand-300) / <alpha-value>)",
          400: "rgb(var(--sand-400) / <alpha-value>)",
          500: "rgb(var(--sand-500) / <alpha-value>)",
          600: "rgb(var(--sand-600) / <alpha-value>)",
          700: "rgb(var(--sand-700) / <alpha-value>)",
        },
        // Ember (accent orange) stays fixed across both themes
        ember: {
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA6C0C",
          700: "#C2540A",
        },
        bark: {
          800: "rgb(var(--bark-800) / <alpha-value>)",
          850: "rgb(var(--bark-850) / <alpha-value>)",
          900: "rgb(var(--bark-900) / <alpha-value>)",
          950: "rgb(var(--bark-950) / <alpha-value>)",
        },
        accent: "#F97316",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm:  "6px",
        md:  "10px",
        lg:  "12px",
        xl:  "16px",
        "2xl": "20px",
      },
      // Shadows adapt per theme via CSS variables
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        glow: "0 0 20px rgba(249,115,22,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
