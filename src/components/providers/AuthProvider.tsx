"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getUserProfile, ensureUserProfile } from "@/lib/firebase/users";
import { useAuth } from "@/store/useAuth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setProfile = useAuth((s) => s.setProfile);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }
      let profile = await getUserProfile(user.uid);
      if (!profile) profile = await ensureUserProfile(user);
      setProfile(profile);
    });
    return unsub;
  }, [setProfile]);

  return <>{children}</>;
}
