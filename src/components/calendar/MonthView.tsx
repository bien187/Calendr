"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfDay,
  format,
} from "date-fns";
import { useWorkspace } from "@/store/useWorkspace";
import { resolveEventColor } from "@/lib/eventColor";
import { isToday } from "@/lib/dates";
import type { EventOccurrence } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MAX_PER_CELL = 3;

export function MonthView({
  occurrences,
  onSelect,
  onPickDay,
}: {
  occurrences: EventOccurrence[];
  onSelect: (o: EventOccurrence) => void;
  onPickDay: (ts: number) => void;
}) {
  const focusDate = useWorkspace((s) => s.focusDate);
  const subgroups = useWorkspace((s) => s.subgroups);
  const setFocusDate = useWorkspace((s) => s.setFocusDate);
  const setView = useWorkspace((s) => s.setView);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(focusDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(focusDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [focusDate]);

  const byDay = useMemo(() => {
    const map = new Map<number, EventOccurrence[]>();
    for (const o of occurrences) {
      const key = startOfDay(o.occurrenceStart).getTime();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return map;
  }, [occurrences]);

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-border bg-surface text-center text-[11px] font-medium text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const ts = day.getTime();
          const items = byDay.get(startOfDay(ts).getTime()) ?? [];
          const outside = !isSameMonth(day, focusDate);
          const today = isToday(ts);
          return (
            <button
              key={ts}
              onClick={() => onPickDay(startOfDay(ts).getTime())}
              onDoubleClick={() => {
                setFocusDate(ts);
                setView("week");
              }}
              className={cn(
                "flex min-h-[88px] flex-col gap-1 border-b border-r border-border p-1 text-left transition hover:bg-elevated/50",
                outside && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-xs font-medium",
                  today ? "bg-accent text-white" : "text-fg"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-col gap-0.5">
                {items.slice(0, MAX_PER_CELL).map((o) => {
                  const color = resolveEventColor(o, subgroups);
                  return (
                    <span
                      key={o.occurrenceKey}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(o);
                      }}
                      className="truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight"
                      style={{
                        backgroundColor: `${color}22`,
                        color,
                      }}
                    >
                      {o.allDay ? "" : format(o.occurrenceStart, "HH:mm ")}
                      {o.title}
                    </span>
                  );
                })}
                {items.length > MAX_PER_CELL && (
                  <span className="px-1 text-[10px] font-medium text-muted">
                    +{items.length - MAX_PER_CELL} mehr
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { isSameDay };
