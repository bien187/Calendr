"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Moon, LogOut, BellRing } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/store/useAuth";
import { logout } from "@/lib/firebase/authActions";
import { updateUserProfile, saveFcmToken } from "@/lib/firebase/users";
import { requestFcmToken, onForegroundMessage } from "@/lib/firebase/messaging";
import { setTheme } from "@/components/providers/ThemeProvider";
import { REMINDER_OPTIONS } from "@/lib/reminders";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const profile = useAuth((s) => s.profile);
  const patchProfile = useAuth((s) => s.patchProfile);
  const router = useRouter();

  const [dark, setDark] = useState(false);
  const [defaults, setDefaults] = useState<number[]>(
    profile?.notificationDefaults ?? [60]
  );
  const [pushState, setPushState] = useState<"idle" | "on" | "denied">("idle");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const unsub = onForegroundMessage(({ title, body }) => {
      if (title) new Notification(title, { body });
    });
    return () => {
      unsub.then((u) => u());
    };
  }, []);

  if (!profile) return null;

  async function toggleDefault(min: number) {
    const next = defaults.includes(min)
      ? defaults.filter((m) => m !== min)
      : [...defaults, min];
    setDefaults(next);
    patchProfile({ notificationDefaults: next });
    await updateUserProfile(profile!.userId, { notificationDefaults: next });
  }

  async function enablePush() {
    const token = await requestFcmToken();
    if (!token) {
      setPushState("denied");
      return;
    }
    await saveFcmToken(profile!.userId, token);
    setPushState("on");
  }

  async function doLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Einstellungen" />

      <div className="space-y-6 p-4">
        {/* Profile */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
          <Avatar name={profile.name} src={profile.avatar} size={48} />
          <div className="min-w-0">
            <div className="truncate font-semibold">{profile.name}</div>
            <div className="truncate text-sm text-muted">{profile.email}</div>
          </div>
        </div>

        {/* Push */}
        <Section icon={<BellRing className="h-4 w-4" />} title="Push-Benachrichtigungen">
          <p className="mb-3 text-sm text-muted">
            Erlaube Benachrichtigungen, um Erinnerungen auf diesem Gerät zu
            erhalten (Web, iOS PWA, Android).
          </p>
          {pushState === "on" ? (
            <div className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600">
              ✓ Benachrichtigungen aktiviert
            </div>
          ) : pushState === "denied" ? (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
              Berechtigung verweigert oder nicht unterstützt. In den
              Browser-Einstellungen aktivierbar.
            </div>
          ) : (
            <Button variant="secondary" onClick={enablePush}>
              Aktivieren
            </Button>
          )}
        </Section>

        {/* Reminder defaults */}
        <Section icon={<Bell className="h-4 w-4" />} title="Standard-Erinnerungen">
          <p className="mb-3 text-sm text-muted">
            Vorausgewählt bei neuen Terminen.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {REMINDER_OPTIONS.map((r) => {
              const on = defaults.includes(r.minutes);
              return (
                <button
                  key={r.minutes}
                  onClick={() => toggleDefault(r.minutes)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    on
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted"
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Theme */}
        <Section icon={<Moon className="h-4 w-4" />} title="Darstellung">
          <div className="flex items-center justify-between">
            <span className="text-sm">Dunkles Design</span>
            <button
              onClick={() => {
                const next = !dark;
                setDark(next);
                setTheme(next);
              }}
              className={cn(
                "relative h-6 w-10 rounded-full transition",
                dark ? "bg-accent" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
                  dark ? "left-[18px]" : "left-0.5"
                )}
              />
            </button>
          </div>
        </Section>

        <Button variant="ghost" className="w-full text-red-600" onClick={doLogout}>
          <LogOut className="h-4 w-4" /> Abmelden
        </Button>

        <p className="pb-6 text-center text-xs text-muted">Calendr · v0.1.0</p>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}
