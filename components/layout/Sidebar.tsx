"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, bottomNavItems } from "./nav-items";
import { signOut } from "@/lib/auth/actions";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface SidebarProps { userEmail: string; }

export function Sidebar({ userEmail }: SidebarProps) {
  const t = useTranslation();
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const navLabels: Record<string, string> = {
    "/dashboard": t.nav.dashboard,
    "/courses": t.nav.courses,
    "/study": t.nav.study,
    "/review": t.nav.review,
    "/quiz": t.nav.quiz,
    "/chat": t.nav.chat,
    "/settings": t.nav.settings,
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-bark-900 border-r border-warm z-30">
      {/* Wordmark */}
      <div className="px-4 py-5 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-1 w-fit">
          <span className="text-ember-500 font-bold text-lg tracking-tight">Pom</span>
          <span className="text-sand-200 font-bold text-lg tracking-tight">AI</span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-2 pb-2 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium",
                "transition-all duration-100",
                active
                  ? "bg-ember-500/15 text-ember-400"
                  : "text-sand-500 hover:text-sand-200 hover:bg-bark-800",
              ].join(" ")}
            >
              <Icon className={active ? "text-ember-400" : "text-sand-600"} />
              {navLabels[href]}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ember-500 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: settings + user */}
      <div className="px-2 pb-3 flex flex-col gap-0.5 border-t border-warm pt-2 shrink-0">
        {bottomNavItems.map(({ href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium",
                "transition-all duration-100",
                active ? "bg-ember-500/15 text-ember-400" : "text-sand-500 hover:text-sand-200 hover:bg-bark-800",
              ].join(" ")}
            >
              <Icon className={active ? "text-ember-400" : "text-sand-600"} />
              {navLabels[href]}
            </Link>
          );
        })}

        {/* User row */}
        <div className="mt-1 mx-1 px-3 py-2.5 rounded-lg bg-bark-800 border border-warm">
          <p className="text-sand-300 text-xs font-medium truncate">{userEmail}</p>
          <form action={signOut}>
            <button type="submit" className="text-sand-600 text-xs hover:text-red-400 transition-colors mt-0.5">
              {t.nav.signOut}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
