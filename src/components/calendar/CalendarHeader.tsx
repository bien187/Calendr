"use client";

import { useState } from "react";
import { addMonths, addWeeks, startOfWeek, endOfWeek, format } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import { useWorkspace } from "@/store/useWorkspace";
import { fmtMonthYear } from "@/lib/dates";
import type { CalendarView } from "@/lib/types";
import { cn } from "@/lib/utils";

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "month", label: "Monat" },
  { id: "week", label: "Woche" },
  { id: "agenda", label: "Liste" },
];

export function CalendarHeader() {
  const view = useWorkspace((s) => s.view);
  const setView = useWorkspace((s) => s.setView);
  const focusDate = useWorkspace((s) => s.focusDate);
  const setFocusDate = useWorkspace((s) => s.setFocusDate);
  const groups = useWorkspace((s) => s.groups);
  const activeGroupId = useWorkspace((s) => s.activeGroupId);
  const setActiveGroup = useWorkspace((s) => s.setActiveGroup);

  const [groupOpen, setGroupOpen] = useState(false);
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  function shift(dir: 1 | -1) {
    if (view === "week") setFocusDate(addWeeks(focusDate, dir).getTime());
    else setFocusDate(addMonths(focusDate, dir).getTime());
  }

  function title() {
    if (view === "week") {
      const s = startOfWeek(focusDate, { weekStartsOn: 1 });
      const e = endOfWeek(focusDate, { weekStartsOn: 1 });
      return `${format(s, "d.", { locale: de })}–${format(e, "d. MMM", { locale: de })}`;
    }
    return fmtMonthYear(focusDate);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        {/* Group switcher */}
        <div className="relative">
          <button
            onClick={() => setGroupOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-left"
          >
            <span className="text-lg">{activeGroup?.emoji ?? "👥"}</span>
            <span className="max-w-[42vw] truncate text-base font-bold tracking-tight">
              {activeGroup?.name ?? "Keine Gruppe"}
            </span>
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>
          {groupOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setGroupOpen(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-1 w-60 overflow-hidden rounded-xl border border-border bg-elevated shadow-xl">
                {groups.length === 0 && (
                  <div className="px-3 py-3 text-sm text-muted">
                    Noch keine Gruppe. Erstelle eine im Tab „Gruppen“.
                  </div>
                )}
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setActiveGroup(g.id);
                      setGroupOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-bg"
                  >
                    <span>{g.emoji ?? "👥"}</span>
                    <span className="flex-1 truncate text-left">{g.name}</span>
                    {g.id === activeGroupId && (
                      <Check className="h-4 w-4 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-0.5 rounded-lg bg-elevated p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                view === v.id ? "bg-surface text-fg shadow-sm" : "text-muted"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view !== "agenda" && (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold capitalize">{title()}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => shift(-1)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-elevated"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setFocusDate(Date.now())}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-accent hover:bg-elevated"
            >
              Heute
            </button>
            <button
              onClick={() => shift(1)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-elevated"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
