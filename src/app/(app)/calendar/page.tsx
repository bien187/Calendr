"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/store/useWorkspace";
import { useEvents } from "@/hooks/useEvents";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { SubgroupFilterBar } from "@/components/calendar/SubgroupFilterBar";
import { AgendaView } from "@/components/calendar/AgendaView";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { ScheduleView } from "@/components/calendar/ScheduleView";
import { EventSheet } from "@/components/calendar/EventSheet";
import { NoGroup } from "@/components/groups/NoGroup";
import type { EventOccurrence } from "@/lib/types";

export default function CalendarPage() {
  const view = useWorkspace((s) => s.view);
  const activeGroupId = useWorkspace((s) => s.activeGroupId);
  const { occurrences, loading } = useEvents();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EventOccurrence | null>(null);
  const [defaultStart, setDefaultStart] = useState<number | undefined>();

  function openCreate(start?: number) {
    setEditing(null);
    setDefaultStart(start);
    setSheetOpen(true);
  }
  function openEdit(o: EventOccurrence) {
    setEditing(o);
    setDefaultStart(undefined);
    setSheetOpen(true);
  }

  if (!activeGroupId) return <NoGroup />;

  return (
    <div className="relative flex h-dvh flex-col md:h-dvh">
      <CalendarHeader />
      <SubgroupFilterBar />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading && occurrences.length === 0 ? (
          <div className="grid place-items-center py-24">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : view === "agenda" ? (
          <AgendaView occurrences={occurrences} onSelect={openEdit} />
        ) : view === "schedule" ? (
          <ScheduleView
            occurrences={occurrences}
            onSelect={openEdit}
            onCreate={(ts) => openCreate(ts)}
          />
        ) : view === "month" ? (
          <MonthView
            occurrences={occurrences}
            onSelect={openEdit}
            onPickDay={(ts) => openCreate(ts + 9 * 3600_000)}
          />
        ) : (
          <WeekView occurrences={occurrences} onSelect={openEdit} />
        )}
      </div>

      {/* Floating create button */}
      <button
        onClick={() => openCreate()}
        className="fixed bottom-20 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-lg shadow-accent/40 transition active:scale-95 md:bottom-6"
        aria-label="Termin erstellen"
      >
        <Plus className="h-6 w-6" />
      </button>

      <EventSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        editing={editing}
        defaultStart={defaultStart}
      />
    </div>
  );
}
