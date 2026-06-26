"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfDay,
  addMonths,
  format,
} from "date-fns";
import { de } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { useWorkspace } from "@/store/useWorkspace";
import { resolveEventColor } from "@/lib/eventColor";
import { fmtTime, isToday, relativeDayLabel } from "@/lib/dates";
import type { EventOccurrence } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MAX_DOTS = 4;

export function MonthView({
  expand,
  onSelect,
  onCreate,
}: {
  expand: (start: number, end: number) => EventOccurrence[];
  onSelect: (o: EventOccurrence) => void;
  onCreate: (dayTs: number) => void;
}) {
  const focusDate = useWorkspace((s) => s.focusDate);
  const subgroups = useWorkspace((s) => s.subgroups);
  const jumpTo = useWorkspace((s) => s.jumpTo);

  const [selectedDay, setSelectedDay] = useState(() =>
    startOfDay(focusDate).getTime()
  );

  // keep selection within the focused month after month changes
  useEffect(() => {
    if (!isSameMonth(selectedDay, focusDate)) {
      setSelectedDay(startOfDay(startOfMonth(focusDate)).getTime());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusDate]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(focusDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(focusDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [focusDate]);

  const byDay = useMemo(() => {
    const start = days[0].getTime();
    const end = days[days.length - 1].getTime() + 86_400_000;
    const map = new Map<number, EventOccurrence[]>();
    for (const o of expand(start, end)) {
      const key = startOfDay(o.occurrenceStart).getTime();
      (map.get(key) ?? map.set(key, []).get(key)!).push(o);
    }
    return map;
  }, [days, expand]);

  const selectedItems = (byDay.get(selectedDay) ?? []).sort(
    (a, b) => a.occurrenceStart - b.occurrenceStart
  );

  // horizontal swipe → change month
  const touchX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 60) jumpTo(addMonths(focusDate, dx < 0 ? 1 : -1).getTime());
  }

  return (
    <div className="flex h-full flex-col">
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="shrink-0 border-b border-border"
      >
        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const ts = startOfDay(day).getTime();
            const items = byDay.get(ts) ?? [];
            const outside = !isSameMonth(day, focusDate);
            const today = isToday(ts);
            const selected = ts === selectedDay;
            return (
              <button
                key={ts}
                onClick={() => setSelectedDay(ts)}
                className={cn(
                  "flex h-14 flex-col items-center gap-1 py-1.5 transition",
                  outside && "opacity-35",
                  selected && "rounded-xl bg-elevated"
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-sm font-medium",
                    today
                      ? "bg-accent text-white"
                      : selected
                        ? "text-accent"
                        : "text-fg"
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {items.slice(0, MAX_DOTS).map((o) => (
                    <span
                      key={o.occurrenceKey}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: resolveEventColor(o, subgroups) }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day agenda */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-3 pb-24 md:pb-6">
        <h3 className="mb-2 px-1 text-sm font-semibold">
          {relativeDayLabel(selectedDay)}
        </h3>
        {selectedItems.length === 0 ? (
          <button
            onClick={() => onCreate(selectedDay + 9 * 3_600_000)}
            className="w-full rounded-xl border border-dashed border-border py-6 text-sm text-muted transition hover:bg-elevated"
          >
            Keine Termine · Antippen zum Erstellen
          </button>
        ) : (
          <div className="space-y-1.5">
            {selectedItems.map((o) => {
              const color = resolveEventColor(o, subgroups);
              return (
                <button
                  key={o.occurrenceKey}
                  onClick={() => onSelect(o)}
                  className="flex w-full items-stretch gap-3 overflow-hidden rounded-xl border border-border bg-surface text-left shadow-sm transition active:scale-[0.99] hover:border-accent/40"
                >
                  <span className="w-1.5 shrink-0" style={{ backgroundColor: color }} />
                  <div className="min-w-0 py-2.5 pr-3">
                    <div className="truncate font-semibold leading-snug">
                      {o.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <span>
                        {o.allDay
                          ? "Ganztägig"
                          : `${fmtTime(o.occurrenceStart)} – ${fmtTime(o.occurrenceEnd)}`}
                      </span>
                      {o.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" /> {o.location}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export { isSameDay };
