"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, bottomNavItems } from "./nav-items";
import { signOut } from "@/lib/auth/actions";

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="
        hidden md:flex flex-col
        fixed left-0 top-0 bottom-0 w-56
        bg-bark-850 border-r border-warm
        z-30
      "
    >
      {/* Wordmark */}
      <div className="px-5 py-5 border-b border-warm shrink-0">
        <Link href="/dashboard" className="flex items-center gap-1 w-fit">
          <span className="text-accent font-bold text-lg tracking-tight">Pom</span>
          <span className="text-sand-200 font-bold text-lg tracking-tight">AI</span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded text-sm",
                "transition-colors duration-100",
                active
                  ? "bg-ember-500/15 text-ember-400"
                  : "text-sand-500 hover:text-sand-200 hover:bg-muted",
              ].join(" ")}
            >
              <Icon
                className={active ? "text-ember-500" : "text-sand-600"}
              />
              {label}
              {/* Active pill */}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ember-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: settings + user */}
      <div className="px-3 pb-4 flex flex-col gap-0.5 border-t border-warm pt-3 shrink-0">
        {bottomNavItems.map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded text-sm",
                "transition-colors duration-100",
                active
                  ? "bg-ember-500/15 text-ember-400"
                  : "text-sand-500 hover:text-sand-200 hover:bg-muted",
              ].join(" ")}
            >
              <Icon className={active ? "text-ember-500" : "text-sand-600"} />
              {label}
            </Link>
          );
        })}

        {/* User row */}
        <div className="mt-2 px-3 py-2.5 rounded bg-muted border border-warm">
          <p className="text-sand-200 text-xs font-medium truncate">{userEmail}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sand-600 text-xs hover:text-red-400 transition-colors mt-0.5"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
