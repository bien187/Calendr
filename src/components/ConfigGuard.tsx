"use client";

import { isFirebaseConfigured } from "@/lib/firebase/client";

/** Shows a setup hint instead of crashing when env vars are missing. */
export function ConfigGuard({ children }: { children: React.ReactNode }) {
  if (isFirebaseConfigured) return <>{children}</>;
  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-6">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-6 text-center">
        <div className="mb-3 text-3xl">🛠️</div>
        <h1 className="mb-2 text-lg font-semibold">Firebase nicht konfiguriert</h1>
        <p className="text-sm text-muted">
          Lege eine <code className="rounded bg-elevated px-1">.env.local</code>{" "}
          mit deinen Firebase-Keys an (siehe{" "}
          <code className="rounded bg-elevated px-1">.env.example</code>) und
          starte den Dev-Server neu.
        </p>
      </div>
    </div>
  );
}
