"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, bottomNavItems } from "./nav-items";
import { useTheme } from "@/components/providers/ThemeProvider";

const allItems = [...navItems, ...bottomNavItems];

function usePageTitle(): string {
  const pathname = usePathname();
  const found = allItems.find(({ href }) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  });
  if (found) return found.label;
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export function Topbar() {
  const title = usePageTitle();
  const { theme, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-20 bg-bark-900/90 backdrop-blur-md border-b border-warm px-4 md:px-6 flex items-center justify-between shrink-0 transition-colors duration-300"
      style={{ height: "52px" }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile wordmark */}
        <Link href="/dashboard" className="flex items-center gap-1 md:hidden">
          <span className="text-ember-500 font-bold text-base">Pom</span>
          <span className="text-sand-200 font-bold text-base">AI</span>
        </Link>

        {/* Desktop page title */}
        <h1 className="hidden md:block text-sand-200 font-semibold text-base tracking-tight">{title}</h1>

        {/* Mobile subtitle */}
        <span className="md:hidden text-sand-500 text-sm">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sand-500 hover:text-sand-200 hover:bg-bark-800 transition-all duration-150"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        <div id="topbar-actions" className="flex items-center gap-2" />
      </div>
    </header>
  );
}
