"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Plus, Trash2, Shield, LogOut, RefreshCw } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/store/useAuth";
import { useWorkspace } from "@/store/useWorkspace";
import {
  subscribeSubgroups,
  subscribeMembers,
  addSubgroup,
  deleteSubgroup,
  updateSubgroup,
  setMemberRole,
  leaveGroup,
  regenerateInviteToken,
} from "@/lib/firebase/groups";
import { SUBGROUP_COLORS } from "@/lib/colors";
import type { Group, GroupMember, Subgroup } from "@/lib/types";

export function ManageGroupSheet({
  group,
  open,
  onClose,
}: {
  group: Group | null;
  open: boolean;
  onClose: () => void;
}) {
  const profile = useAuth((s) => s.profile);
  const setActiveGroup = useWorkspace((s) => s.setActiveGroup);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [newSub, setNewSub] = useState("");

  useEffect(() => {
    if (!group || !open) return;
    setToken(group.inviteToken);
    const a = subscribeMembers(group.id, setMembers);
    const b = subscribeSubgroups(group.id, setSubgroups);
    return () => {
      a();
      b();
    };
  }, [group, open]);

  if (!group) return null;

  const me = members.find((m) => m.userId === profile?.userId);
  const isAdmin = me?.role === "admin";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const inviteUrl = `${appUrl}/invite/${token}`;

  async function copy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function regen() {
    const t = await regenerateInviteToken(group!.id);
    setToken(t);
  }

  async function addSub() {
    if (!newSub.trim()) return;
    await addSubgroup(group!.id, newSub, subgroups.length);
    setNewSub("");
  }

  async function leave() {
    if (!profile) return;
    if (!confirm(`„${group!.name}“ verlassen?`)) return;
    await leaveGroup(group!.id, profile.userId);
    setActiveGroup(null);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={`${group.emoji ?? "👥"} ${group.name}`}>
      <div className="space-y-6">
        {/* Invite */}
        <section>
          <SectionLabel>Einladungslink</SectionLabel>
          <div className="flex gap-2">
            <Input readOnly value={inviteUrl} className="text-xs" />
            <Button variant="secondary" size="icon" onClick={copy} title="Kopieren">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {isAdmin && (
            <button
              onClick={regen}
              className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-fg"
            >
              <RefreshCw className="h-3 w-3" /> Neuen Link generieren
            </button>
          )}
        </section>

        {/* Members */}
        <section>
          <SectionLabel>Mitglieder · {members.length}</SectionLabel>
          <div className="space-y-1.5">
            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3">
                <Avatar name={m.name} src={m.avatar} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {m.name} {m.userId === profile?.userId && "(du)"}
                  </div>
                  <div className="truncate text-xs text-muted">{m.email}</div>
                </div>
                {isAdmin && m.userId !== profile?.userId ? (
                  <button
                    onClick={() =>
                      setMemberRole(
                        group.id,
                        m.userId,
                        m.role === "admin" ? "member" : "admin"
                      )
                    }
                    className="flex items-center gap-1 rounded-lg bg-elevated px-2 py-1 text-xs"
                  >
                    <Shield className="h-3 w-3" />
                    {m.role === "admin" ? "Admin" : "Mitglied"}
                  </button>
                ) : (
                  <span className="text-xs capitalize text-muted">{m.role}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Subgroups */}
        <section>
          <SectionLabel>Personen & Kategorien</SectionLabel>
          <p className="mb-2 text-xs text-muted">
            Subgruppen sind farbige Tags zum Zuweisen von Terminen (nicht
            beitretbar).
          </p>
          <div className="space-y-1.5">
            {subgroups.map((sg) => (
              <SubgroupRow key={sg.id} groupId={group.id} sg={sg} />
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSub()}
              placeholder="Neue Person / Kategorie"
            />
            <Button variant="secondary" size="icon" onClick={addSub}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Leave */}
        <button
          onClick={leave}
          className="flex items-center gap-2 text-sm font-medium text-red-600"
        >
          <LogOut className="h-4 w-4" /> Gruppe verlassen
        </button>
      </div>
    </Sheet>
  );
}

function SubgroupRow({ groupId, sg }: { groupId: string; sg: Subgroup }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sg.name);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border px-2.5 py-2">
      <div className="flex gap-1">
        {SUBGROUP_COLORS.slice(0, 6).map((c) => (
          <button
            key={c}
            onClick={() => updateSubgroup(groupId, sg.id, { color: c })}
            className="h-4 w-4 rounded-full ring-offset-1 transition"
            style={{
              backgroundColor: c,
              boxShadow: sg.color === c ? `0 0 0 2px ${c}` : "none",
            }}
          />
        ))}
      </div>
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            updateSubgroup(groupId, sg.id, { name: name.trim() || sg.name });
            setEditing(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 truncate text-left text-sm"
        >
          {sg.name}
        </button>
      )}
      <button
        onClick={() => deleteSubgroup(groupId, sg.id)}
        className="text-muted hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
    </h3>
  );
}
