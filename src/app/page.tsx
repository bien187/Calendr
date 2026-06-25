"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";

export default function Home() {
  const profile = useAuth((s) => s.profile);
  const router = useRouter();

  useEffect(() => {
    if (profile === undefined) return; // still loading
    router.replace(profile ? "/calendar" : "/login");
  }, [profile, router]);

  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}
