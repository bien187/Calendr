import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isBefore,
} from "date-fns";
import type { CalendarEvent, EventOccurrence } from "./types";

/**
 * Expand a (possibly recurring) event into concrete occurrences that overlap
 * the [windowStart, windowEnd] range. Non-recurring events yield 0 or 1.
 *
 * Cheap and bounded: we step from the event start and stop once past the
 * window end (or recurrence endDate), capped to avoid runaway loops.
 */
const MAX_OCCURRENCES = 750;

function step(date: Date, freq: CalendarEvent["recurrence"]["frequency"], interval: number): Date {
  switch (freq) {
    case "daily":
      return addDays(date, interval);
    case "weekly":
      return addWeeks(date, interval);
    case "monthly":
      return addMonths(date, interval);
    case "yearly":
      return addYears(date, interval);
    default:
      return addYears(date, 1000); // none — effectively no next step
  }
}

export function expandEvent(
  event: CalendarEvent,
  windowStart: number,
  windowEnd: number
): EventOccurrence[] {
  const duration = event.end - event.start;
  const { frequency, interval, endDate } = event.recurrence;

  if (frequency === "none") {
    if (event.start <= windowEnd && event.end >= windowStart) {
      return [makeOccurrence(event, event.start, duration)];
    }
    return [];
  }

  const out: EventOccurrence[] = [];
  const hardEnd = Math.min(windowEnd, endDate ?? windowEnd);
  let cursor = new Date(event.start);
  let guard = 0;

  // Fast-forward: skip occurrences far before the window for long histories.
  while (
    cursor.getTime() + duration < windowStart &&
    guard < MAX_OCCURRENCES
  ) {
    cursor = step(cursor, frequency, Math.max(1, interval));
    guard++;
  }

  while (cursor.getTime() <= hardEnd && guard < MAX_OCCURRENCES) {
    const occStart = cursor.getTime();
    const occEnd = occStart + duration;
    if (occEnd >= windowStart) {
      if (!endDate || occStart <= endDate) {
        out.push(makeOccurrence(event, occStart, duration));
      }
    }
    const nextCursor = step(cursor, frequency, Math.max(1, interval));
    if (!isBefore(cursor, nextCursor)) break; // safety: no forward progress
    cursor = nextCursor;
    guard++;
  }

  return out;
}

function makeOccurrence(
  event: CalendarEvent,
  occStart: number,
  duration: number
): EventOccurrence {
  return {
    ...event,
    occurrenceStart: occStart,
    occurrenceEnd: occStart + duration,
    occurrenceKey: `${event.id}:${occStart}`,
  };
}

/** Expand a list of events and return occurrences sorted by start time. */
export function expandEvents(
  events: CalendarEvent[],
  windowStart: number,
  windowEnd: number
): EventOccurrence[] {
  const out: EventOccurrence[] = [];
  for (const e of events) {
    out.push(...expandEvent(e, windowStart, windowEnd));
  }
  return out.sort((a, b) => a.occurrenceStart - b.occurrenceStart);
}

export const FREQUENCY_LABELS: Record<
  CalendarEvent["recurrence"]["frequency"],
  string
> = {
  none: "Keine Wiederholung",
  daily: "Täglich",
  weekly: "Wöchentlich",
  monthly: "Monatlich",
  yearly: "Jährlich",
};
