"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";

// Shows the 5 primary nav items as a fixed bottom tab bar on mobile.
// Hidden on md+ screens (Sidebar takes over).

export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="
        md:hidden
        fixed bottom-0 left-0 right-0 z-30
        bg-bark-850 border-t border-warm
        flex items-stretch
        safe-bottom
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.map(({ label, href, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5",
              "text-[10px] font-medium tracking-wide transition-colors duration-100",
              active ? "text-ember-400" : "text-sand-600",
            ].join(" ")}
          >
            <Icon className={active ? "text-ember-500" : ""} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
