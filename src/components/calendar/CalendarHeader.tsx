"use client";

import { useState } from "react";
import {
  addMonths,
  addWeeks,
  startOfWeek,
  endOfWeek,
  format,
} from "date-fns";
import { de } from "date-fns/locale";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronDown,
  Check,
  CalendarDays,
  List,
  Columns3,
  Rows3,
} from "lucide-react";
import { useWorkspace } from "@/store/useWorkspace";
import { fmtMonthYear } from "@/lib/dates";
import { LeftDrawer } from "@/components/nav/LeftDrawer";
import type { CalendarView } from "@/lib/types";
import { cn } from "@/lib/utils";

const VIEWS: { id: CalendarView; label: string; icon: typeof List }[] = [
  { id: "month", label: "Monat", icon: CalendarDays },
  { id: "weekList", label: "Woche (Liste)", icon: List },
  { id: "week", label: "Woche (Timeline)", icon: Columns3 },
  { id: "schedule", label: "Schedule", icon: Rows3 },
];

export function CalendarHeader() {
  const view = useWorkspace((s) => s.view);
  const setView = useWorkspace((s) => s.setView);
  const focusDate = useWorkspace((s) => s.focusDate);
  const jumpTo = useWorkspace((s) => s.jumpTo);

  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);

  const stepByWeek = view !== "month";

  function shift(dir: 1 | -1) {
    const next = stepByWeek
      ? addWeeks(focusDate, dir)
      : addMonths(focusDate, dir);
    jumpTo(next.getTime());
  }

  function title() {
    if (view === "week" || view === "weekList") {
      const s = startOfWeek(focusDate, { weekStartsOn: 1 });
      const e = endOfWeek(focusDate, { weekStartsOn: 1 });
      return `${format(s, "d.", { locale: de })}–${format(e, "d. MMM", { locale: de })}`;
    }
    return fmtMonthYear(focusDate);
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-border bg-surface/90 px-2.5 py-2.5 backdrop-blur">
        <button
          onClick={() => setDrawer(true)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-fg hover:bg-elevated"
          aria-label="Menü"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Period label → tap switches to Month view */}
        <button
          onClick={() => setView("month")}
          className="flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 text-left"
        >
          <span className="truncate text-lg font-bold capitalize tracking-tight">
            {title()}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => shift(-1)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-elevated"
            aria-label="Zurück"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => jumpTo(Date.now())}
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-accent hover:bg-elevated"
          >
            Heute
          </button>
          <button
            onClick={() => shift(1)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-elevated"
            aria-label="Weiter"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* View switcher */}
          <div className="relative">
            <button
              onClick={() => setMenu((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-lg text-fg hover:bg-elevated"
              aria-label="Ansicht"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-elevated shadow-xl">
                  {VIEWS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setView(id);
                        setMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-bg"
                    >
                      <Icon className="h-4 w-4 text-muted" />
                      <span className="flex-1 text-left">{label}</span>
                      {view === id && <Check className="h-4 w-4 text-accent" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <LeftDrawer open={drawer} onClose={() => setDrawer(false)} />
    </>
  );
}
