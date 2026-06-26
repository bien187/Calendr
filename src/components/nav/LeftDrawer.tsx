"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Check, Settings, LogOut, Plus, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/store/useAuth";
import { useWorkspace } from "@/store/useWorkspace";
import { logout } from "@/lib/firebase/authActions";
import { cn } from "@/lib/utils";

export function LeftDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const groups = useWorkspace((s) => s.groups);
  const activeGroupId = useWorkspace((s) => s.activeGroupId);
  const setActiveGroup = useWorkspace((s) => s.setActiveGroup);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !profile) return null;

  async function doLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-surface shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between p-5 pb-3">
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-elevated"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 px-5 pb-5">
          <Avatar name={profile.name} src={profile.avatar} size={52} />
          <div className="min-w-0">
            <div className="truncate text-lg font-bold">{profile.name}</div>
            <div className="truncate text-sm text-muted">{profile.email}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 no-scrollbar">
          {/* Group switcher */}
          <SectionLabel>Gruppen</SectionLabel>
          <div className="mb-4 space-y-0.5">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setActiveGroup(g.id);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-elevated"
              >
                <span className="text-lg">{g.emoji ?? "👥"}</span>
                <span className="flex-1 truncate text-left font-medium">{g.name}</span>
                {g.id === activeGroupId && <Check className="h-4 w-4 text-accent" />}
              </button>
            ))}
            <Link
              href="/groups"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-elevated"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-elevated">
                <Plus className="h-4 w-4" />
              </span>
              Gruppe erstellen / verwalten
            </Link>
          </div>

          <SectionLabel>Allgemein</SectionLabel>
          <Item href="/groups" icon={<Users className="h-5 w-5" />} onClose={onClose}>
            Gruppen & Mitglieder
          </Item>
          <Item href="/settings" icon={<Settings className="h-5 w-5" />} onClose={onClose}>
            Einstellungen
          </Item>
        </div>

        <div className="border-t border-border p-3 pb-safe">
          <button
            onClick={doLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-elevated"
          >
            <LogOut className="h-5 w-5" /> Abmelden
          </button>
        </div>
      </aside>
    </div>
  );
}

function Item({
  href,
  icon,
  children,
  onClose,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-elevated"
      )}
    >
      <span className="text-muted">{icon}</span>
      {children}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
    </h3>
  );
}
