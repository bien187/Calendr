"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { useAuth } from "@/store/useAuth";
import { useWorkspace } from "@/store/useWorkspace";
import { createGroup } from "@/lib/firebase/groups";

const EMOJIS = ["👨‍👩‍👧‍👦", "🏠", "👥", "🏡", "🎓", "💼", "⚽", "🐾"];

export function CreateGroupSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const profile = useAuth((s) => s.profile);
  const setActiveGroup = useWorkspace((s) => s.setActiveGroup);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!profile || !name.trim()) return;
    setSaving(true);
    try {
      const id = await createGroup(profile, name, emoji);
      setActiveGroup(id);
      setName("");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Neue Gruppe"
      footer={
        <Button
          className="w-full"
          onClick={create}
          loading={saving}
          disabled={!name.trim()}
        >
          Gruppe erstellen
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Symbol</Label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`grid h-11 w-11 place-items-center rounded-xl text-xl transition ${
                  emoji === e ? "bg-accent/15 ring-2 ring-accent" : "bg-elevated"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Name</Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Familie Müller"
          />
        </div>
        <p className="text-xs text-muted">
          Du wirst Admin und kannst danach Mitglieder einladen und Personen
          (Subgruppen) anlegen.
        </p>
      </div>
    </Sheet>
  );
}
