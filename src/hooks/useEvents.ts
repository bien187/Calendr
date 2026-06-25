"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  addMonths,
} from "date-fns";
import { useWorkspace } from "@/store/useWorkspace";
import { subscribeEventsInRange } from "@/lib/firebase/events";
import { expandEvents } from "@/lib/recurrence";
import type { CalendarEvent, CalendarView, EventOccurrence } from "@/lib/types";

const weekOpts = { weekStartsOn: 1 as const }; // Monday

/** Compute the data window to fetch for a given view + focus date. */
export function windowFor(view: CalendarView, focus: number): [number, number] {
  const d = new Date(focus);
  switch (view) {
    case "month": {
      // pad to full weeks shown in the grid
      return [
        startOfWeek(startOfMonth(d), weekOpts).getTime(),
        endOfWeek(endOfMonth(d), weekOpts).getTime(),
      ];
    }
    case "week":
      return [
        startOfWeek(d, weekOpts).getTime(),
        endOfWeek(d, weekOpts).getTime(),
      ];
    case "agenda":
    default:
      // a rolling 3-month window for the agenda list
      return [startOfDay(d).getTime(), endOfMonth(addMonths(d, 2)).getTime()];
  }
}

/**
 * Subscribes to events for the active group within the view window, expands
 * recurrence, and applies the active subgroup filter. Returns sorted
 * occurrences plus a loading flag.
 */
export function useEvents() {
  const activeGroupId = useWorkspace((s) => s.activeGroupId);
  const view = useWorkspace((s) => s.view);
  const focusDate = useWorkspace((s) => s.focusDate);
  const filter = useWorkspace((s) => s.activeSubgroupFilter);

  const [raw, setRaw] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [winStart, winEnd] = useMemo(
    () => windowFor(view, focusDate),
    [view, focusDate]
  );

  useEffect(() => {
    if (!activeGroupId) {
      setRaw([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeEventsInRange(
      activeGroupId,
      winStart,
      winEnd,
      (events) => {
        setRaw(events);
        setLoading(false);
      }
    );
    return unsub;
  }, [activeGroupId, winStart, winEnd]);

  const occurrences = useMemo<EventOccurrence[]>(() => {
    const expanded = expandEvents(raw, winStart, winEnd);
    if (filter.length === 0) return expanded;
    return expanded.filter((o) =>
      o.assignedSubgroups.some((id) => filter.includes(id))
    );
  }, [raw, winStart, winEnd, filter]);

  return { occurrences, loading, window: [winStart, winEnd] as const };
}
