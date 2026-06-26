"use client";

import { useCallback, useEffect, useState } from "react";
import { useWorkspace } from "@/store/useWorkspace";
import { subscribeAllEvents } from "@/lib/firebase/events";
import { expandEvents } from "@/lib/recurrence";
import type { CalendarEvent, EventOccurrence } from "@/lib/types";

/**
 * Loads all events for the active group once and returns a memoised `expand`
 * that materialises recurrence into occurrences for any [windowStart,
 * windowEnd] range, applying the active subgroup filter. This lets views
 * render arbitrary (and growing) windows for endless scrolling.
 */
export function useEvents() {
  const activeGroupId = useWorkspace((s) => s.activeGroupId);
  const filter = useWorkspace((s) => s.activeSubgroupFilter);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeGroupId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeAllEvents(activeGroupId, (e) => {
      setEvents(e);
      setLoading(false);
    });
    return unsub;
  }, [activeGroupId]);

  const expand = useCallback(
    (windowStart: number, windowEnd: number): EventOccurrence[] => {
      const occ = expandEvents(events, windowStart, windowEnd);
      if (filter.length === 0) return occ;
      return occ.filter((o) =>
        o.assignedSubgroups.some((id) => filter.includes(id))
      );
    },
    [events, filter]
  );

  return { events, loading, expand };
}
