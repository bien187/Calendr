"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, Repeat, Bell, Trash2, AlignLeft } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Select, DateTimeInput } from "@/components/ui/Field";
import { useAuth } from "@/store/useAuth";
import { useWorkspace } from "@/store/useWorkspace";
import { createEvent, updateEvent, deleteEvent } from "@/lib/firebase/events";
import { FREQUENCY_LABELS } from "@/lib/recurrence";
import { REMINDER_OPTIONS } from "@/lib/reminders";
import { toDateInput, toTimeInput, fromInputs } from "@/lib/datetimeInput";
import { hexToRgba } from "@/lib/colors";
import type {
  CalendarEvent,
  EventOccurrence,
  RecurrenceFrequency,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  /** existing event (edit) — pass occurrence or null for create */
  editing?: EventOccurrence | null;
  /** default start (epoch ms) when creating */
  defaultStart?: number;
}

export function EventSheet({ open, onClose, editing, defaultStart }: Props) {
  const profile = useAuth((s) => s.profile);
  const activeGroupId = useWorkspace((s) => s.activeGroupId);
  const subgroups = useWorkspace((s) => s.subgroups);

  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("09:00");
  const [timeTo, setTimeTo] = useState("10:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("none");
  const [interval, setInterval] = useState(1);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [reminders, setReminders] = useState<number[]>(
    profile?.notificationDefaults ?? [60]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // hydrate form when opened
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setTitle(editing.title);
      setAllDay(editing.allDay);
      setDate(toDateInput(editing.start));
      setEndDate(toDateInput(editing.end));
      setTimeFrom(toTimeInput(editing.start));
      setTimeTo(toTimeInput(editing.end));
      setLocation(editing.location ?? "");
      setDescription(editing.description ?? "");
      setFrequency(editing.recurrence.frequency);
      setInterval(editing.recurrence.interval || 1);
      setAssigned(editing.assignedSubgroups);
      setReminders(editing.reminders ?? []);
    } else {
      const base = defaultStart ?? Date.now();
      setTitle("");
      setAllDay(false);
      setDate(toDateInput(base));
      setEndDate(toDateInput(base));
      setTimeFrom("09:00");
      setTimeTo("10:00");
      setLocation("");
      setDescription("");
      setFrequency("none");
      setInterval(1);
      setAssigned([]);
      setReminders(profile?.notificationDefaults ?? [60]);
    }
  }, [open, editing, defaultStart, profile]);

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  /** Returns a German error message, or null if the form is valid. */
  function validate(): string | null {
    if (!title.trim()) return "Bitte gib einen Titel ein.";
    if (!date) return "Bitte wähle ein Datum.";

    const start = allDay ? fromInputs(date, "00:00") : fromInputs(date, timeFrom);
    const end = allDay
      ? fromInputs(endDate || date, "23:59")
      : fromInputs(date, timeTo);

    if (allDay) {
      if ((endDate || date) < date)
        return "Das Enddatum muss am oder nach dem Startdatum liegen.";
    } else if (end <= start) {
      return "Die Endzeit muss nach der Startzeit liegen.";
    }

    // Only block past dates for *new* events — editing old ones stays allowed.
    if (!editing) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (allDay) {
        if (fromInputs(date, "00:00") < todayStart.getTime())
          return "Das Datum liegt in der Vergangenheit.";
      } else if (start < Date.now()) {
        return "Der Termin liegt in der Vergangenheit.";
      }
    }

    return null;
  }

  async function save() {
    if (!activeGroupId || !profile) return;

    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSaving(true);

    const start = allDay
      ? fromInputs(date, "00:00")
      : fromInputs(date, timeFrom);
    const end = allDay
      ? fromInputs(endDate || date, "23:59")
      : fromInputs(date, timeTo);

    const payload = {
      title: title.trim(),
      start,
      end: end > start ? end : start + 30 * 60_000,
      allDay,
      location: location.trim() || null,
      mapLink: location.trim()
        ? `https://maps.google.com/?q=${encodeURIComponent(location.trim())}`
        : null,
      description: description.trim() || null,
      recurrence: { frequency, interval: Math.max(1, interval), endDate: null },
      assignedSubgroups: assigned,
      color: null,
      reminders,
    };

    try {
      if (editing) {
        await updateEvent(activeGroupId, editing.id, payload);
      } else {
        await createEvent(activeGroupId, profile.userId, payload as CalendarEvent);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!activeGroupId || !editing) return;
    if (!confirm("Diesen Termin löschen?")) return;
    setSaving(true);
    try {
      await deleteEvent(activeGroupId, editing.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Termin bearbeiten" : "Neuer Termin"}
      footer={
        <div className="space-y-2">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            {editing && (
              <Button variant="ghost" size="md" onClick={remove} className="text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              className="flex-1"
              size="md"
              onClick={save}
              loading={saving}
              disabled={!title.trim() || !activeGroupId}
            >
              {editing ? "Speichern" : "Erstellen"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Title — big and fast */}
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel des Termins"
          className="w-full bg-transparent text-lg font-semibold placeholder:text-muted focus:outline-none"
        />

        {/* All-day toggle */}
        <Row icon={<Clock className="h-4 w-4" />}>
          <div className="flex items-center justify-between">
            <span className="text-sm">Ganztägig</span>
            <Switch checked={allDay} onChange={() => setAllDay((v) => !v)} />
          </div>
        </Row>

        {/* Date & time */}
        <Row>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{allDay ? "Von" : "Datum"}</Label>
              <DateTimeInput
                type="date"
                value={date}
                min={editing ? undefined : toDateInput(Date.now())}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {allDay ? (
              <div>
                <Label>Bis</Label>
                <DateTimeInput
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Start</Label>
                  <DateTimeInput
                    type="time"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Ende</Label>
                  <DateTimeInput
                    type="time"
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </Row>

        {/* Subgroups */}
        {subgroups.length > 0 && (
          <Row>
            <Label>Zugewiesen an</Label>
            <div className="flex flex-wrap gap-1.5">
              {subgroups.map((sg) => {
                const on = assigned.includes(sg.id);
                return (
                  <button
                    key={sg.id}
                    type="button"
                    onClick={() => setAssigned((a) => toggle(a, sg.id))}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition"
                    )}
                    style={{
                      borderColor: on ? sg.color : "rgb(var(--border))",
                      backgroundColor: on ? hexToRgba(sg.color, 0.16) : "transparent",
                      color: on ? sg.color : "rgb(var(--muted))",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: sg.color }}
                    />
                    {sg.name}
                  </button>
                );
              })}
            </div>
          </Row>
        )}

        {/* Location */}
        <Row icon={<MapPin className="h-4 w-4" />}>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ort hinzufügen"
          />
        </Row>

        {/* Recurrence */}
        <Row icon={<Repeat className="h-4 w-4" />}>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
            >
              {(Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </Select>
            {frequency !== "none" && (
              <Input
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-16 text-center"
                title="Intervall"
              />
            )}
          </div>
        </Row>

        {/* Reminders */}
        <Row icon={<Bell className="h-4 w-4" />}>
          <Label>Erinnerungen</Label>
          <div className="flex flex-wrap gap-1.5">
            {REMINDER_OPTIONS.map((r) => {
              const on = reminders.includes(r.minutes);
              return (
                <button
                  key={r.minutes}
                  type="button"
                  onClick={() => setReminders((s) => toggle(s, r.minutes))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    on
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted"
                  )}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </Row>

        {/* Notes */}
        <Row icon={<AlignLeft className="h-4 w-4" />}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notizen"
          />
        </Row>
      </div>
    </Sheet>
  );
}

function Row({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {icon && <div className="mt-2 shrink-0 text-muted">{icon}</div>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative h-6 w-10 rounded-full transition",
        checked ? "bg-accent" : "bg-border"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
          checked ? "left-[18px]" : "left-0.5"
        )}
      />
    </button>
  );
}
