"use client";

import { useMemo } from "react";
import { startOfDay, addDays, format } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Repeat, Bell } from "lucide-react";
import { useWorkspace } from "@/store/useWorkspace";
import { SCHEDULE_DAYS } from "@/hooks/useEvents";
import { resolveEventColor } from "@/lib/eventColor";
import { fmtTime, isToday } from "@/lib/dates";
import type { EventOccurrence } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Fixed height each event (and each empty day) occupies — the "day height". */
const ROW_H = 96;

/**
 * Day-list view: consecutive days stacked vertically. A day with one event
 * shows it at the full day height; with several events each gets the same
 * (day) height. Empty days show a tappable "create" slot.
 */
export function ScheduleView({
  occurrences,
  onSelect,
  onCreate,
}: {
  occurrences: EventOccurrence[];
  onSelect: (o: EventOccurrence) => void;
  onCreate: (dayTs: number) => void;
}) {
  const focusDate = useWorkspace((s) => s.focusDate);
  const subgroups = useWorkspace((s) => s.subgroups);

  const days = useMemo(() => {
    const start = startOfDay(focusDate);
    const byDay = new Map<number, EventOccurrence[]>();
    for (const o of occurrences) {
      const key = startOfDay(o.occurrenceStart).getTime();
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(o);
    }
    return Array.from({ length: SCHEDULE_DAYS }, (_, i) => {
      const d = addDays(start, i);
      const key = d.getTime();
      const items = (byDay.get(key) ?? []).sort(
        (a, b) => a.occurrenceStart - b.occurrenceStart
      );
      return { date: d, key, items };
    });
  }, [focusDate, occurrences]);

  return (
    <div className="divide-y divide-border">
      {days.map(({ date, key, items }) => {
        const today = isToday(key);
        return (
          <div key={key} className="flex gap-3 px-3 py-2">
            {/* Day rail */}
            <div className="w-11 shrink-0 pt-1 text-center">
              <div
                className={cn(
                  "text-[11px] font-medium uppercase",
                  today ? "text-accent" : "text-muted"
                )}
              >
                {format(date, "EEEEEE", { locale: de })}
              </div>
              <div
                className={cn(
                  "text-2xl font-bold leading-tight",
                  today ? "text-accent" : "text-fg"
                )}
              >
                {format(date, "d")}
              </div>
            </div>

            {/* Day content */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {items.length === 0 ? (
                <button
                  onClick={() => onCreate(key + 9 * 3_600_000)}
                  className="flex items-center rounded-2xl bg-elevated/60 px-4 text-sm text-muted transition active:scale-[0.99] hover:bg-elevated"
                  style={{ height: ROW_H }}
                >
                  Antippen zum Erstellen
                </button>
              ) : (
                items.map((o) => (
                  <EventCard
                    key={o.occurrenceKey}
                    occ={o}
                    color={resolveEventColor(o, subgroups)}
                    onClick={() => onSelect(o)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventCard({
  occ,
  color,
  onClick,
}: {
  occ: EventOccurrence;
  color: string;
  onClick: () => void;
}) {
  const time = occ.allDay
    ? "Ganztägig"
    : `${fmtTime(occ.occurrenceStart)} – ${fmtTime(occ.occurrenceEnd)}`;
  const recurring = occ.recurrence.frequency !== "none";
  const hasReminder = (occ.reminders?.length ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-stretch gap-3 overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-sm transition active:scale-[0.99] hover:border-accent/40"
      style={{ height: ROW_H }}
    >
      <span className="w-1.5 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex min-w-0 flex-col justify-center py-2 pr-3">
        <div className="truncate text-base font-semibold leading-snug">
          {occ.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
          <span>{time}</span>
          {occ.location && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{occ.location}</span>
            </span>
          )}
          {recurring && <Repeat className="h-3.5 w-3.5" />}
          {hasReminder && <Bell className="h-3.5 w-3.5" />}
        </div>
      </div>
    </button>
  );
}
