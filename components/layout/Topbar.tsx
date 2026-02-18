"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, bottomNavItems } from "./nav-items";

const allItems = [...navItems, ...bottomNavItems];

// Derives a human-readable title from the current pathname.
function usePageTitle(): string {
  const pathname = usePathname();

  // Exact matches first
  const found = allItems.find(({ href }) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  });
  if (found) return found.label;

  // Fallback: capitalise the last path segment
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Topbar() {
  const title = usePageTitle();

  return (
    <header
      className="
        sticky top-0 z-20
        bg-bark-900/90 backdrop-blur-sm
        border-b border-warm
        px-4 md:px-6 h-13
        flex items-center justify-between
        shrink-0
      "
      style={{ height: "52px" }}
    >
      {/* Mobile: wordmark | Desktop: page title */}
      <div className="flex items-center gap-3">
        {/* Wordmark — only on mobile (md: hidden) */}
        <Link href="/dashboard" className="flex items-center gap-1 md:hidden">
          <span className="text-accent font-bold text-base">Pom</span>
          <span className="text-sand-200 font-bold text-base">AI</span>
        </Link>

        {/* Page title — desktop */}
        <h1 className="hidden md:block text-sand-200 font-semibold text-base">
          {title}
        </h1>

        {/* Page title — mobile (secondary, muted) */}
        <span className="md:hidden text-sand-500 text-sm">{title}</span>
      </div>

      {/* Right side — reserved for actions (added per-page in later steps) */}
      <div id="topbar-actions" className="flex items-center gap-2" />
    </header>
  );
}
