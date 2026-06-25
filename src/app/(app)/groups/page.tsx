"use client";

import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { useWorkspace } from "@/store/useWorkspace";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { CreateGroupSheet } from "@/components/groups/CreateGroupSheet";
import { ManageGroupSheet } from "@/components/groups/ManageGroupSheet";
import type { Group } from "@/lib/types";

export default function GroupsPage() {
  const groups = useWorkspace((s) => s.groups);
  const setActiveGroup = useWorkspace((s) => s.setActiveGroup);
  const [createOpen, setCreateOpen] = useState(false);
  const [manage, setManage] = useState<Group | null>(null);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Gruppen"
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Neu
          </Button>
        }
      />

      <div className="space-y-2 p-4">
        {groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted">
              Du bist noch in keiner Gruppe. Erstelle deine erste!
            </p>
          </div>
        )}

        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setActiveGroup(g.id);
              setManage(g);
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-accent/40"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-elevated text-xl">
              {g.emoji ?? "👥"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{g.name}</div>
              <div className="text-xs text-muted">
                {g.memberIds.length}{" "}
                {g.memberIds.length === 1 ? "Mitglied" : "Mitglieder"}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </button>
        ))}
      </div>

      <CreateGroupSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <ManageGroupSheet
        group={manage}
        open={!!manage}
        onClose={() => setManage(null)}
      />
    </div>
  );
}
