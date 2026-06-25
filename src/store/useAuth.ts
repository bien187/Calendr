"use client";

import { create } from "zustand";
import type { UserProfile } from "@/lib/types";

interface AuthState {
  /** undefined = loading, null = signed out */
  profile: UserProfile | null | undefined;
  setProfile: (p: UserProfile | null) => void;
  patchProfile: (p: Partial<UserProfile>) => void;
}

export const useAuth = create<AuthState>((set) => ({
  profile: undefined,
  setProfile: (profile) => set({ profile }),
  patchProfile: (patch) =>
    set((s) => ({
      profile: s.profile ? { ...s.profile, ...patch } : s.profile,
    })),
}));
