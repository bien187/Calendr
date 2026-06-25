"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { ConfigGuard } from "@/components/ConfigGuard";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default function LoginPage() {
  const profile = useAuth((s) => s.profile);
  const router = useRouter();

  useEffect(() => {
    if (profile) router.replace("/calendar");
  }, [profile, router]);

  return (
    <ConfigGuard>
      <Suspense fallback={null}>
        <AuthScreen />
      </Suspense>
    </ConfigGuard>
  );
}
