import { format } from "date-fns";

/** epoch ms → value for <input type="date"> */
export function toDateInput(ts: number) {
  return format(ts, "yyyy-MM-dd");
}

/** epoch ms → value for <input type="time"> */
export function toTimeInput(ts: number) {
  return format(ts, "HH:mm");
}

/** combine a date input + time input into epoch ms */
export function fromInputs(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = (timeStr || "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}
