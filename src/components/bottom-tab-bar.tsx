"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Gamepad2, Plus, BarChart3, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home, authRequired: false },
  { href: "/games", label: "Games", icon: Gamepad2, authRequired: false },
  { href: "/games/new", label: "Log Game", icon: Plus, authRequired: true, center: true },
  { href: "/leaderboard", label: "Standings", icon: BarChart3, authRequired: false },
  { href: "/profile", label: "Profile", icon: User, authRequired: true },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const visibleTabs = tabs.filter((tab) => !tab.authRequired || session?.user);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm md:hidden">
      <div className="flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.href);
          if (tab.center) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 -mt-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
                  <tab.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-semibold text-primary">
                  {tab.label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 py-1.5 px-2"
            >
              <tab.icon
                className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] ${active ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
