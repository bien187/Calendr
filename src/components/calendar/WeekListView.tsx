"use client";

import { EndlessDayList } from "./EndlessDayList";
import type { EventOccurrence } from "@/lib/types";

/** Endless day list with week separators (Woche · Liste). */
export function WeekListView({
  expand,
  onSelect,
  onCreate,
}: {
  expand: (start: number, end: number) => EventOccurrence[];
  onSelect: (o: EventOccurrence) => void;
  onCreate: (dayTs: number) => void;
}) {
  return (
    <EndlessDayList
      variant="weekList"
      expand={expand}
      onSelect={onSelect}
      onCreate={onCreate}
    />
  );
}
