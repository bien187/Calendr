"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  startOfDay,
  getISOWeek,
  format,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Repeat, Bell } from "lucide-react";
import { useWorkspace } from "@/store/useWorkspace";
import { resolveEventColor } from "@/lib/eventColor";
import { fmtTime, isToday } from "@/lib/dates";
import type { EventOccurrence } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Day height — ~25% thinner than before (was 96). */
const ROW_H = 72;
const EMPTY_H = 52;
const DAY = 86_400_000;

const INITIAL_BEFORE = 21;
const INITIAL_AFTER = 70;
const CHUNK = 30;

interface Props {
  expand: (start: number, end: number) => EventOccurrence[];
  onSelect: (o: EventOccurrence) => void;
  onCreate: (dayTs: number) => void;
  /** "weekList" inserts a week separator before each Monday. */
  variant: "schedule" | "weekList";
}

export function EndlessDayList({ expand, onSelect, onCreate, variant }: Props) {
  const subgroups = useWorkspace((s) => s.subgroups);
  const focusDate = useWorkspace((s) => s.focusDate);
  const setFocusDate = useWorkspace((s) => s.setFocusDate);
  const jumpNonce = useWorkspace((s) => s.jumpNonce);

  const scroller = useRef<HTMLDivElement>(null);
  const topSentinel = useRef<HTMLDivElement>(null);
  const bottomSentinel = useRef<HTMLDivElement>(null);
  // scroll-preservation bookkeeping for prepends
  const prepend = useRef<{ prevHeight: number; prevTop: number } | null>(null);

  // window of days: firstDay (epoch ms, midnight) + count
  const [firstDay, setFirstDay] = useState(() =>
    startOfDay(focusDate).getTime() - INITIAL_BEFORE * DAY
  );
  const [count, setCount] = useState(INITIAL_BEFORE + INITIAL_AFTER);

  // Re-centre on programmatic jumps (Heute / arrows / month tap).
  useEffect(() => {
    const f = startOfDay(focusDate).getTime();
    setFirstDay(f - INITIAL_BEFORE * DAY);
    setCount(INITIAL_BEFORE + INITIAL_AFTER);
    // scroll to focus day after the new range renders
    requestAnimationFrame(() => {
      const el = scroller.current?.querySelector<HTMLElement>(
        `[data-day="${f}"]`
      );
      el?.scrollIntoView({ block: "start" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpNonce]);

  // Expand events for the visible window and bucket them by day.
  const buckets = useMemo(() => {
    const windowStart = firstDay;
    const windowEnd = firstDay + count * DAY;
    const occ = expand(windowStart, windowEnd);
    const byDay = new Map<number, EventOccurrence[]>();
    for (const o of occ) {
      const key = startOfDay(o.occurrenceStart).getTime();
      (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(o);
    }
    return Array.from({ length: count }, (_, i) => {
      const dayTs = firstDay + i * DAY;
      const items = (byDay.get(dayTs) ?? []).sort(
        (a, b) => a.occurrenceStart - b.occurrenceStart
      );
      return { dayTs, items };
    });
  }, [firstDay, count, expand]);

  // Grow the window when sentinels come into view.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (e.target === bottomSentinel.current) {
            setCount((c) => c + CHUNK);
          } else if (e.target === topSentinel.current) {
            prepend.current = {
              prevHeight: root.scrollHeight,
              prevTop: root.scrollTop,
            };
            setFirstDay((f) => f - CHUNK * DAY);
            setCount((c) => c + CHUNK);
          }
        }
      },
      { root, rootMargin: "400px 0px" }
    );
    if (topSentinel.current) io.observe(topSentinel.current);
    if (bottomSentinel.current) io.observe(bottomSentinel.current);
    return () => io.disconnect();
  }, []);

  // Keep scroll position stable after a prepend.
  useLayoutEffect(() => {
    const root = scroller.current;
    if (!root || !prepend.current) return;
    const { prevHeight, prevTop } = prepend.current;
    root.scrollTop = prevTop + (root.scrollHeight - prevHeight);
    prepend.current = null;
  }, [firstDay]);

  // Sync the header's focus date to the top-most visible day (no jump).
  function onScroll() {
    const root = scroller.current;
    if (!root) return;
    const rows = root.querySelectorAll<HTMLElement>("[data-day]");
    const top = root.getBoundingClientRect().top + 8;
    for (const row of Array.from(rows)) {
      const r = row.getBoundingClientRect();
      if (r.bottom >= top) {
        const ts = Number(row.dataset.day);
        if (ts && startOfDay(focusDate).getTime() !== ts) setFocusDate(ts);
        break;
      }
    }
  }

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className="h-full overflow-y-auto overscroll-contain no-scrollbar"
    >
      <div ref={topSentinel} className="h-px" />
      <div className="divide-y divide-border pb-24 md:pb-6">
        {buckets.map(({ dayTs, items }) => (
          <DayRow
            key={dayTs}
            dayTs={dayTs}
            items={items}
            subgroups={subgroups}
            showWeek={variant === "weekList" && new Date(dayTs).getDay() === 1}
            onSelect={onSelect}
            onCreate={onCreate}
          />
        ))}
      </div>
      <div ref={bottomSentinel} className="h-px" />
    </div>
  );
}

function DayRow({
  dayTs,
  items,
  subgroups,
  showWeek,
  onSelect,
  onCreate,
}: {
  dayTs: number;
  items: EventOccurrence[];
  subgroups: ReturnType<typeof useWorkspace.getState>["subgroups"];
  showWeek: boolean;
  onSelect: (o: EventOccurrence) => void;
  onCreate: (dayTs: number) => void;
}) {
  const date = new Date(dayTs);
  const today = isToday(dayTs);
  return (
    <div data-day={dayTs}>
      {showWeek && (
        <div className="flex items-center gap-2 bg-bg/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          KW {getISOWeek(date)}
          <span className="font-normal normal-case">
            {format(startOfWeek(date, { weekStartsOn: 1 }), "d.", { locale: de })}
            –
            {format(endOfWeek(date, { weekStartsOn: 1 }), "d. MMM", { locale: de })}
          </span>
        </div>
      )}
      <div className="flex gap-3 px-3 py-1.5">
        <div className="w-10 shrink-0 pt-0.5 text-center">
          <div
            className={cn(
              "text-[10px] font-medium uppercase",
              today ? "text-accent" : "text-muted"
            )}
          >
            {format(date, "EEEEEE", { locale: de })}
          </div>
          <div
            className={cn(
              "text-xl font-bold leading-tight",
              today
                ? "mx-auto grid h-8 w-8 place-items-center rounded-full bg-accent text-white"
                : "text-fg"
            )}
          >
            {format(date, "d")}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {items.length === 0 ? (
            <button
              onClick={() => onCreate(dayTs + 9 * 3_600_000)}
              className="flex items-center rounded-xl px-3 text-sm text-muted/70 transition hover:bg-elevated"
              style={{ height: EMPTY_H }}
            >
              +
            </button>
          ) : (
            items.map((o) => (
              <EventCard
                key={o.occurrenceKey}
                occ={o}
                color={resolveEventColor(o, subgroups)}
                onClick={() => onSelect(o)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({
  occ,
  color,
  onClick,
}: {
  occ: EventOccurrence;
  color: string;
  onClick: () => void;
}) {
  const time = occ.allDay
    ? "Ganztägig"
    : `${fmtTime(occ.occurrenceStart)} – ${fmtTime(occ.occurrenceEnd)}`;
  const recurring = occ.recurrence.frequency !== "none";
  const hasReminder = (occ.reminders?.length ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-stretch gap-2.5 overflow-hidden rounded-xl border border-border bg-surface text-left shadow-sm transition active:scale-[0.99] hover:border-accent/40"
      style={{ minHeight: ROW_H }}
    >
      <span className="w-1.5 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex min-w-0 flex-col justify-center py-1.5 pr-3">
        <div className="truncate font-semibold leading-snug">{occ.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted">
          <span>{time}</span>
          {occ.location && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{occ.location}</span>
            </span>
          )}
          {recurring && <Repeat className="h-3 w-3" />}
          {hasReminder && <Bell className="h-3 w-3" />}
        </div>
      </div>
    </button>
  );
}
