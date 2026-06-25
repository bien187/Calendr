"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { ConfigGuard } from "@/components/ConfigGuard";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import { BottomNav, SideNav } from "@/components/nav/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = useAuth((s) => s.profile);
  const router = useRouter();

  useEffect(() => {
    if (profile === null) router.replace("/login");
  }, [profile, router]);

  if (profile === undefined || profile === null) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <ConfigGuard>
      <WorkspaceProvider>
        <div className="flex min-h-dvh bg-bg">
          <SideNav />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <BottomNav />
        </div>
      </WorkspaceProvider>
    </ConfigGuard>
  );
}
