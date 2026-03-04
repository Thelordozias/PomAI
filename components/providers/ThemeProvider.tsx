"use client";

import { useEffect, createContext, useContext, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getAutoTheme(): Theme {
  const hour = new Date().getHours();
  // Light from 7am to 8pm, dark otherwise
  return hour >= 7 && hour < 20 ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // On mount: read saved preference or use time-based auto theme
  useEffect(() => {
    const saved = localStorage.getItem("pom-theme") as Theme | null;
    const initial = saved ?? getAutoTheme();
    setTheme(initial);
    applyTheme(initial);

    // Re-check every minute in case the hour boundary passes
    const interval = setInterval(() => {
      // Only auto-switch if the user hasn't set a manual preference
      const manualOverride = localStorage.getItem("pom-theme-manual");
      if (!manualOverride) {
        const auto = getAutoTheme();
        setTheme(auto);
        applyTheme(auto);
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("pom-theme", next);
      // Mark as manual so auto-switch won't override
      localStorage.setItem("pom-theme-manual", "1");
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
