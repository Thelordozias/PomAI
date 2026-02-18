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
        // Savannah Dusk palette
        sand: {
          50:  "#FAF3E0",
          100: "#F0E0C0",
          200: "#E8D5B0",  // primary text
          300: "#D4BC8A",
          400: "#B89A60",
          500: "#A89070",  // secondary text
          600: "#8A7050",
          700: "#6A5038",
        },
        ember: {
          400: "#F09050",
          500: "#E8732A",  // primary accent
          600: "#D4612A",
          700: "#B84E1E",
        },
        bark: {
          800: "#2D2018",  // card surface
          850: "#241A13",  // page surface
          900: "#1C1510",  // page background
          950: "#140E09",
        },
        border: "#4A3020",   // subtle warm border
        muted:  "#3A2818",   // muted surface (inputs, hover)
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.4)",
        lift: "0 4px 12px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
