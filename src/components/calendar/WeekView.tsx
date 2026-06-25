"use client";

import { useMemo, useRef, useState } from "react";
import {
  startOfWeek,
  addDays,
  startOfDay,
  isSameDay,
  format,
  differenceInMinutes,
} from "date-fns";
import { de } from "date-fns/locale";
import { useWorkspace } from "@/store/useWorkspace";
import { resolveEventColor } from "@/lib/eventColor";
import { updateEvent } from "@/lib/firebase/events";
import { isToday } from "@/lib/dates";
import type { EventOccurrence } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOUR_H = 48; // px per hour
const SNAP = 15; // minutes
const DAY_START = 0;
const DAY_END = 24;

type DragState =
  | { type: "move"; occ: EventOccurrence; grabOffsetMin: number }
  | { type: "resize"; occ: EventOccurrence }
  | null;

export function WeekView({
  occurrences,
  onSelect,
}: {
  occurrences: EventOccurrence[];
  onSelect: (o: EventOccurrence) => void;
}) {
  const focusDate = useWorkspace((s) => s.focusDate);
  const subgroups = useWorkspace((s) => s.subgroups);
  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const [previewMin, setPreviewMin] = useState<number | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(focusDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [focusDate]);

  const timed = occurrences.filter((o) => !o.allDay);
  const allDay = occurrences.filter((o) => o.allDay);

  function minutesFromTop(clientY: number) {
    const grid = gridRef.current;
    if (!grid) return 0;
    const rect = grid.getBoundingClientRect();
    const y = clientY - rect.top + grid.scrollTop;
    const mins = (y / HOUR_H) * 60;
    return Math.round(mins / SNAP) * SNAP;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    setPreviewMin(minutesFromTop(e.clientY));
  }

  async function onPointerUp() {
    if (!drag || previewMin == null) {
      setDrag(null);
      setPreviewMin(null);
      return;
    }
    const occ = drag.occ;
    const dayStart = startOfDay(occ.occurrenceStart).getTime();
    const duration = occ.occurrenceEnd - occ.occurrenceStart;

    if (drag.type === "move") {
      const newStartMin = clamp(previewMin - drag.grabOffsetMin, 0, 24 * 60 - 1);
      const newStart = dayStart + newStartMin * 60_000;
      await updateEvent(occ.groupId, occ.id, {
        start: newStart,
        end: newStart + duration,
      });
    } else {
      const startMin = differenceInMinutes(occ.occurrenceStart, dayStart);
      const newEndMin = clamp(previewMin, startMin + SNAP, 24 * 60);
      await updateEvent(occ.groupId, occ.id, {
        end: dayStart + newEndMin * 60_000,
      });
    }
    setDrag(null);
    setPreviewMin(null);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-[44px_repeat(7,1fr)] border-b border-border bg-surface">
        <div />
        {days.map((d) => (
          <div key={d.getTime()} className="py-1.5 text-center">
            <div className="text-[10px] uppercase text-muted">
              {format(d, "EEE", { locale: de })}
            </div>
            <div
              className={cn(
                "mx-auto grid h-6 w-6 place-items-center rounded-full text-xs font-semibold",
                isToday(d) ? "bg-accent text-white" : "text-fg"
              )}
            >
              {format(d, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day row */}
      {allDay.length > 0 && (
        <div className="grid grid-cols-[44px_repeat(7,1fr)] border-b border-border bg-surface">
          <div className="grid place-items-center text-[9px] text-muted">ganzt.</div>
          {days.map((d) => (
            <div key={d.getTime()} className="space-y-0.5 p-0.5">
              {allDay
                .filter((o) => isSameDay(o.occurrenceStart, d))
                .map((o) => {
                  const color = resolveEventColor(o, subgroups);
                  return (
                    <button
                      key={o.occurrenceKey}
                      onClick={() => onSelect(o)}
                      className="block w-full truncate rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      {o.title}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div
        ref={gridRef}
        className="relative flex-1 overflow-y-auto no-scrollbar"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => drag && onPointerUp()}
      >
        <div
          className="grid grid-cols-[44px_repeat(7,1fr)]"
          style={{ height: (DAY_END - DAY_START) * HOUR_H }}
        >
          {/* Hour labels */}
          <div className="relative">
            {Array.from({ length: DAY_END - DAY_START }, (_, i) => (
              <div
                key={i}
                className="absolute right-1 -translate-y-1/2 text-[10px] text-muted"
                style={{ top: i * HOUR_H }}
              >
                {i > 0 ? `${i}:00` : ""}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const dayItems = timed.filter((o) => isSameDay(o.occurrenceStart, d));
            return (
              <div key={d.getTime()} className="relative border-l border-border">
                {/* hour lines */}
                {Array.from({ length: DAY_END - DAY_START }, (_, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 border-t border-border/60"
                    style={{ top: i * HOUR_H }}
                  />
                ))}

                {dayItems.map((o) => (
                  <EventBlock
                    key={o.occurrenceKey}
                    occ={o}
                    color={resolveEventColor(o, subgroups)}
                    drag={drag}
                    previewMin={previewMin}
                    onOpen={() => onSelect(o)}
                    onStartMove={(grabOffsetMin) =>
                      setDrag({ type: "move", occ: o, grabOffsetMin })
                    }
                    onStartResize={() => setDrag({ type: "resize", occ: o })}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventBlock({
  occ,
  color,
  drag,
  previewMin,
  onOpen,
  onStartMove,
  onStartResize,
}: {
  occ: EventOccurrence;
  color: string;
  drag: DragState;
  previewMin: number | null;
  onOpen: () => void;
  onStartMove: (grabOffsetMin: number) => void;
  onStartResize: () => void;
}) {
  const dayStart = startOfDay(occ.occurrenceStart).getTime();
  let startMin = (occ.occurrenceStart - dayStart) / 60_000;
  let endMin = (occ.occurrenceEnd - dayStart) / 60_000;

  const isDragging = drag?.occ.occurrenceKey === occ.occurrenceKey;
  if (isDragging && previewMin != null) {
    if (drag?.type === "move") {
      const dur = endMin - startMin;
      startMin = clamp(previewMin - (drag.grabOffsetMin ?? 0), 0, 24 * 60 - dur);
      endMin = startMin + dur;
    } else if (drag?.type === "resize") {
      endMin = clamp(previewMin, startMin + SNAP, 24 * 60);
    }
  }

  const top = (startMin / 60) * HOUR_H;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_H, 18);

  return (
    <div
      onPointerDown={(e) => {
        // grab offset = where in the block the user grabbed
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const grabMin = ((e.clientY - rect.top) / HOUR_H) * 60 + startMin;
        onStartMove(grabMin - startMin);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onClick={(e) => {
        // treat as click only if not dragged meaningfully
        if (!isDragging) onOpen();
        e.stopPropagation();
      }}
      className={cn(
        "absolute left-0.5 right-0.5 cursor-grab touch-none overflow-hidden rounded-md px-1.5 py-1 text-[10px] leading-tight shadow-sm active:cursor-grabbing",
        isDragging && "z-10 ring-2 ring-accent/60"
      )}
      style={{
        top,
        height,
        backgroundColor: `${color}26`,
        borderLeft: `3px solid ${color}`,
        color,
      }}
    >
      <div className="font-semibold truncate">{occ.title}</div>
      <div className="opacity-80">{format(dayStart + startMin * 60_000, "HH:mm")}</div>

      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartResize();
          (e.currentTarget.parentElement as HTMLElement).setPointerCapture(
            e.pointerId
          );
        }}
        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
      />
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
