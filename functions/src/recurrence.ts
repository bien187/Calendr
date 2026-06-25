import { addDays, addWeeks, addMonths, addYears } from "date-fns";

export type Frequency = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface EventDoc {
  id: string;
  title: string;
  start: number;
  end: number;
  allDay: boolean;
  recurrence: { frequency: Frequency; interval: number; endDate?: number | null };
  reminders: number[];
}

function step(d: Date, freq: Frequency, interval: number): Date {
  switch (freq) {
    case "daily":
      return addDays(d, interval);
    case "weekly":
      return addWeeks(d, interval);
    case "monthly":
      return addMonths(d, interval);
    case "yearly":
      return addYears(d, interval);
    default:
      return addYears(d, 1000);
  }
}

/** Return occurrence start times within [windowStart, windowEnd]. */
export function occurrencesInWindow(
  event: EventDoc,
  windowStart: number,
  windowEnd: number
): number[] {
  const { frequency, interval, endDate } = event.recurrence;
  if (frequency === "none") {
    return event.start >= windowStart && event.start <= windowEnd
      ? [event.start]
      : [];
  }

  const out: number[] = [];
  const hardEnd = Math.min(windowEnd, endDate ?? windowEnd);
  let cursor = new Date(event.start);
  let guard = 0;

  while (cursor.getTime() < windowStart && guard < 2000) {
    cursor = step(cursor, frequency, Math.max(1, interval));
    guard++;
  }
  while (cursor.getTime() <= hardEnd && guard < 2000) {
    out.push(cursor.getTime());
    cursor = step(cursor, frequency, Math.max(1, interval));
    guard++;
  }
  return out;
}
