import {
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import { de } from "date-fns/locale";

const L = { locale: de };

export function fmtTime(ts: number) {
  return format(ts, "HH:mm", L);
}

export function fmtDayLong(ts: number) {
  return format(ts, "EEEE, d. MMMM", L);
}

export function fmtDayShort(ts: number) {
  return format(ts, "EEE d.M.", L);
}

export function fmtMonthYear(ts: number) {
  return format(ts, "MMMM yyyy", L);
}

export function fmtRange(start: number, end: number, allDay: boolean) {
  if (allDay) {
    return isSameDay(start, end)
      ? "Ganztägig"
      : `${format(start, "d. MMM", L)} – ${format(end, "d. MMM", L)}`;
  }
  if (isSameDay(start, end)) {
    return `${fmtTime(start)} – ${fmtTime(end)}`;
  }
  return `${format(start, "d.M. HH:mm", L)} – ${format(end, "d.M. HH:mm", L)}`;
}

/** Friendly relative day label used in the agenda headers. */
export function relativeDayLabel(ts: number) {
  if (isToday(ts)) return "Heute";
  if (isTomorrow(ts)) return "Morgen";
  if (isYesterday(ts)) return "Gestern";
  return fmtDayLong(ts);
}

export { isSameDay, isToday };
