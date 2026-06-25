"use client";

import { useWorkspace } from "@/store/useWorkspace";
import { hexToRgba } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function SubgroupFilterBar() {
  const subgroups = useWorkspace((s) => s.subgroups);
  const filter = useWorkspace((s) => s.activeSubgroupFilter);
  const toggle = useWorkspace((s) => s.toggleSubgroupFilter);
  const clear = useWorkspace((s) => s.clearSubgroupFilter);

  if (subgroups.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-2.5 no-scrollbar">
      <button
        onClick={clear}
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
          filter.length === 0
            ? "bg-fg text-bg"
            : "bg-elevated text-muted"
        )}
      >
        Alle
      </button>
      {subgroups.map((sg) => {
        const active = filter.includes(sg.id);
        return (
          <button
            key={sg.id}
            onClick={() => toggle(sg.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
            )}
            style={{
              borderColor: active ? sg.color : "transparent",
              backgroundColor: active ? hexToRgba(sg.color, 0.16) : "rgb(var(--elevated))",
              color: active ? sg.color : "rgb(var(--muted))",
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: sg.color }}
            />
            {sg.name}
          </button>
        );
      })}
    </div>
  );
}
