"use client";

import { create } from "zustand";
import type { CalendarView, Group, GroupMember, Subgroup } from "@/lib/types";

interface WorkspaceState {
  groups: Group[];
  activeGroupId: string | null;
  subgroups: Subgroup[];
  members: GroupMember[];
  /** subgroup ids currently filtered IN; empty = show all */
  activeSubgroupFilter: string[];
  view: CalendarView;
  /** the date the calendar is focused on (epoch ms) */
  focusDate: number;
  /** bumped whenever a programmatic scroll-to-focusDate is requested */
  jumpNonce: number;

  setGroups: (groups: Group[]) => void;
  setActiveGroup: (id: string | null) => void;
  setSubgroups: (s: Subgroup[]) => void;
  setMembers: (m: GroupMember[]) => void;
  toggleSubgroupFilter: (id: string) => void;
  clearSubgroupFilter: () => void;
  setView: (v: CalendarView) => void;
  /** update focus date WITHOUT requesting a scroll (used by scroll listeners) */
  setFocusDate: (ts: number) => void;
  /** set focus date AND request endless views to scroll there */
  jumpTo: (ts: number) => void;
}

export const useWorkspace = create<WorkspaceState>((set) => ({
  groups: [],
  activeGroupId: null,
  subgroups: [],
  members: [],
  activeSubgroupFilter: [],
  view: "schedule",
  focusDate: Date.now(),
  jumpNonce: 0,

  setGroups: (groups) =>
    set((s) => {
      // keep current selection if still valid, else pick first
      const stillValid =
        s.activeGroupId && groups.some((g) => g.id === s.activeGroupId);
      return {
        groups,
        activeGroupId: stillValid
          ? s.activeGroupId
          : groups[0]?.id ?? null,
      };
    }),
  setActiveGroup: (activeGroupId) =>
    set({ activeGroupId, activeSubgroupFilter: [] }),
  setSubgroups: (subgroups) => set({ subgroups }),
  setMembers: (members) => set({ members }),
  toggleSubgroupFilter: (id) =>
    set((s) => ({
      activeSubgroupFilter: s.activeSubgroupFilter.includes(id)
        ? s.activeSubgroupFilter.filter((x) => x !== id)
        : [...s.activeSubgroupFilter, id],
    })),
  clearSubgroupFilter: () => set({ activeSubgroupFilter: [] }),
  setView: (view) => set({ view }),
  setFocusDate: (focusDate) => set({ focusDate }),
  jumpTo: (focusDate) =>
    set((s) => ({ focusDate, jumpNonce: s.jumpNonce + 1 })),
}));
