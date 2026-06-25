"use client";

import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { MapPin } from "lucide-react";
import { useWorkspace } from "@/store/useWorkspace";
import { relativeDayLabel, fmtTime, isToday } from "@/lib/dates";
import { resolveEventColor } from "@/lib/eventColor";
import type { EventOccurrence } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AgendaView({
  occurrences,
  onSelect,
}: {
  occurrences: EventOccurrence[];
  onSelect: (o: EventOccurrence) => void;
}) {
  const subgroups = useWorkspace((s) => s.subgroups);

  const days = useMemo(() => {
    const map = new Map<number, EventOccurrence[]>();
    for (const o of occurrences) {
      const key = startOfDay(o.occurrenceStart).getTime();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [occurrences]);

  if (days.length === 0) {
    return (
      <EmptyState />
    );
  }

  return (
    <div className="px-4 py-2">
      {days.map(([day, items]) => (
        <section key={day} className="py-2">
          <div className="sticky top-[0px] z-[1] mb-1 flex items-baseline gap-2 py-1">
            <h3
              className={cn(
                "text-sm font-semibold",
                isToday(day) ? "text-accent" : "text-fg"
              )}
            >
              {relativeDayLabel(day)}
            </h3>
            <span className="text-xs text-muted">{items.length}</span>
          </div>
          <div className="space-y-1.5">
            {items.map((o) => {
              const color = resolveEventColor(o, subgroups);
              return (
                <button
                  key={o.occurrenceKey}
                  onClick={() => onSelect(o)}
                  className="flex w-full items-stretch gap-3 rounded-xl border border-border bg-surface p-3 text-left transition active:scale-[0.99] hover:border-accent/40"
                >
                  <div
                    className="w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{o.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <span>
                        {o.allDay
                          ? "Ganztägig"
                          : `${fmtTime(o.occurrenceStart)} – ${fmtTime(o.occurrenceEnd)}`}
                      </span>
                      {o.location && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="h-3 w-3" /> {o.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center -space-x-1">
                    {o.assignedSubgroups.slice(0, 3).map((id) => {
                      const sg = subgroups.find((s) => s.id === id);
                      if (!sg) return null;
                      return (
                        <span
                          key={id}
                          title={sg.name}
                          className="h-3 w-3 rounded-full border-2 border-surface"
                          style={{ backgroundColor: sg.color }}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center px-6 py-24 text-center">
      <div className="mb-3 text-4xl">📅</div>
      <p className="font-medium">Keine Termine</p>
      <p className="mt-1 text-sm text-muted">
        Tippe auf „+“, um deinen ersten Termin zu erstellen.
      </p>
    </div>
  );
}
