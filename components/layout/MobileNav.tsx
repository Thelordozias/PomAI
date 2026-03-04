"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { useTranslation } from "@/components/providers/LanguageProvider";

// Fixed bottom tab bar on mobile. Hidden on md+.
export function MobileNav() {
  const t = useTranslation();
  const pathname = usePathname();

  const navLabels: Record<string, string> = {
    "/dashboard": t.nav.dashboard,
    "/courses": t.nav.courses,
    "/study": t.nav.study,
    "/review": t.nav.review,
    "/quiz": t.nav.quiz,
    "/chat": t.nav.chat,
  };

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bark-900/95 backdrop-blur-md border-t border-warm flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.map(({ href, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5",
              "text-[9px] font-semibold tracking-wide uppercase transition-all duration-100",
              active ? "text-ember-400" : "text-sand-600",
            ].join(" ")}
          >
            <Icon className={active ? "text-ember-400 scale-110" : ""} />
            {navLabels[href]}
          </Link>
        );
      })}
    </nav>
  );
}
