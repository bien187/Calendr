"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/store/useAuth";
import { useWorkspace } from "@/store/useWorkspace";
import { Button } from "@/components/ui/Button";
import { ConfigGuard } from "@/components/ConfigGuard";
import { getGroupByInviteToken, joinGroup } from "@/lib/firebase/groups";
import type { Group } from "@/lib/types";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const setActiveGroup = useWorkspace((s) => s.setActiveGroup);

  const [group, setGroup] = useState<Group | null | undefined>(undefined);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    getGroupByInviteToken(token).then(setGroup);
  }, [token]);

  // not signed in → bounce to login, come back here after
  useEffect(() => {
    if (profile === null) {
      router.replace(`/login?next=/invite/${token}`);
    }
  }, [profile, router, token]);

  async function join() {
    if (!profile || !group) return;
    setJoining(true);
    try {
      await joinGroup(group, profile);
      setActiveGroup(group.id);
      router.replace("/calendar");
    } finally {
      setJoining(false);
    }
  }

  const alreadyMember = group?.memberIds.includes(profile?.userId ?? "");

  return (
    <ConfigGuard>
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="w-full max-w-sm">
          <Logo size={56} className="mx-auto mb-4" />

          {group === undefined && (
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent mx-auto" />
          )}

          {group === null && (
            <>
              <h1 className="text-lg font-semibold">Einladung ungültig</h1>
              <p className="mt-1 text-sm text-muted">
                Dieser Link ist abgelaufen oder existiert nicht mehr.
              </p>
              <Button className="mt-5 w-full" onClick={() => router.replace("/calendar")}>
                Zur App
              </Button>
            </>
          )}

          {group && (
            <>
              <p className="text-sm text-muted">Du wurdest eingeladen zu</p>
              <h1 className="mt-1 text-xl font-bold">
                {group.emoji} {group.name}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {group.memberIds.length} Mitglieder
              </p>
              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={alreadyMember ? () => router.replace("/calendar") : join}
                loading={joining}
              >
                {alreadyMember ? "Zur Gruppe" : "Gruppe beitreten"}
              </Button>
            </>
          )}
        </div>
      </div>
    </ConfigGuard>
  );
}
