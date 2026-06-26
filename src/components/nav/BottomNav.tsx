"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, NotebookPen } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/groups", label: "Gruppen", icon: Users },
  { href: "/notes", label: "Notizen", icon: NotebookPen },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur pb-safe md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium"
            >
              <span
                className={cn(
                  "grid h-8 w-14 place-items-center rounded-full transition",
                  active ? "bg-accent/15 text-accent" : "text-muted"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={active ? "text-accent" : "text-muted"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <Logo size={36} />
        <span className="text-lg font-bold tracking-tight">Calendr</span>
      </div>
      <div className="flex flex-col gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-elevated hover:text-fg"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
