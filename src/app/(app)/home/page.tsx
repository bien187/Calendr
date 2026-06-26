"use client";

import Link from "next/link";
import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { ChevronRight, MapPin } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useWorkspace } from "@/store/useWorkspace";
import { useEvents } from "@/hooks/useEvents";
import { PageHeader } from "@/components/PageHeader";
import { NoGroup } from "@/components/groups/NoGroup";
import { resolveEventColor } from "@/lib/eventColor";
import { relativeDayLabel, fmtTime } from "@/lib/dates";

const WEEK = 7 * 86_400_000;

export default function HomePage() {
  const profile = useAuth((s) => s.profile);
  const activeGroupId = useWorkspace((s) => s.activeGroupId);
  const subgroups = useWorkspace((s) => s.subgroups);
  const { expand } = useEvents();

  const upcoming = useMemo(() => {
    const now = Date.now();
    return expand(startOfDay(now).getTime(), now + WEEK)
      .filter((o) => o.occurrenceEnd >= now)
      .slice(0, 8);
  }, [expand]);

  if (!activeGroupId) return <NoGroup />;

  const firstName = profile?.name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Hallo ${firstName} 👋`} />
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">
            Nächste 7 Tage
          </h2>
          <Link
            href="/calendar"
            className="flex items-center gap-0.5 text-sm font-medium text-accent"
          >
            Kalender <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Keine Termine in den nächsten 7 Tagen.
          </div>
        ) : (
          <div className="space-y-1.5">
            {upcoming.map((o) => {
              const color = resolveEventColor(o, subgroups);
              return (
                <Link
                  key={o.occurrenceKey}
                  href="/calendar"
                  className="flex items-stretch gap-3 overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:border-accent/40"
                >
                  <span className="w-1.5 shrink-0" style={{ backgroundColor: color }} />
                  <div className="min-w-0 py-2.5 pr-3">
                    <div className="truncate font-semibold leading-snug">
                      {o.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <span>{relativeDayLabel(o.occurrenceStart)}</span>
                      <span>
                        {o.allDay ? "Ganztägig" : fmtTime(o.occurrenceStart)}
                      </span>
                      {o.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" /> {o.location}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
