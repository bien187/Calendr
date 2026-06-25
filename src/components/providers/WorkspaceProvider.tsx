"use client";

import { useEffect } from "react";
import { useAuth } from "@/store/useAuth";
import { useWorkspace } from "@/store/useWorkspace";
import { subscribeUserGroups, subscribeSubgroups, subscribeMembers } from "@/lib/firebase/groups";

/** Keeps the workspace store in sync with the user's groups and active group. */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuth((s) => s.profile?.userId);
  const activeGroupId = useWorkspace((s) => s.activeGroupId);
  const setGroups = useWorkspace((s) => s.setGroups);
  const setSubgroups = useWorkspace((s) => s.setSubgroups);
  const setMembers = useWorkspace((s) => s.setMembers);

  // groups list
  useEffect(() => {
    if (!userId) return;
    return subscribeUserGroups(userId, setGroups);
  }, [userId, setGroups]);

  // subgroups + members for the active group
  useEffect(() => {
    if (!activeGroupId) {
      setSubgroups([]);
      setMembers([]);
      return;
    }
    const unsubSub = subscribeSubgroups(activeGroupId, setSubgroups);
    const unsubMem = subscribeMembers(activeGroupId, setMembers);
    return () => {
      unsubSub();
      unsubMem();
    };
  }, [activeGroupId, setSubgroups, setMembers]);

  return <>{children}</>;
}
