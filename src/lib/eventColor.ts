import type { CalendarEvent, Subgroup } from "./types";

const DEFAULT = "#2563eb";

/** Resolve the display color for an event given the group's subgroups. */
export function resolveEventColor(
  event: Pick<CalendarEvent, "color" | "assignedSubgroups">,
  subgroups: Subgroup[]
): string {
  if (event.color) return event.color;
  const first = event.assignedSubgroups
    .map((id) => subgroups.find((s) => s.id === id))
    .find(Boolean);
  return first?.color ?? DEFAULT;
}

export function subgroupsFor(
  ids: string[],
  subgroups: Subgroup[]
): Subgroup[] {
  return ids
    .map((id) => subgroups.find((s) => s.id === id))
    .filter((s): s is Subgroup => Boolean(s));
}
