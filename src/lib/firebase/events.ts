import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./client";
import type { CalendarEvent } from "@/lib/types";

export type NewEventInput = Omit<
  CalendarEvent,
  "id" | "createdAt" | "updatedAt" | "createdBy" | "groupId"
>;

export async function createEvent(
  groupId: string,
  createdBy: string,
  input: NewEventInput
): Promise<string> {
  const ref = doc(collection(db, "groups", groupId, "events"));
  const now = Date.now();
  const event: CalendarEvent = {
    ...input,
    id: ref.id,
    groupId,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, event);
  return ref.id;
}

export async function updateEvent(
  groupId: string,
  eventId: string,
  data: Partial<CalendarEvent>
) {
  await updateDoc(doc(db, "groups", groupId, "events", eventId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteEvent(groupId: string, eventId: string) {
  await deleteDoc(doc(db, "groups", groupId, "events", eventId));
}

/**
 * Subscribe to events in a group whose start is within [rangeStart, rangeEnd].
 *
 * Recurring events are matched by start only here; the recurrence expander
 * widens the picture client-side. To keep recurring series visible we also
 * include any event flagged as recurring regardless of start. Firestore can't
 * OR across fields cheaply, so we run two listeners and merge.
 */
export function subscribeEventsInRange(
  groupId: string,
  rangeStart: number,
  rangeEnd: number,
  cb: (events: CalendarEvent[]) => void
) {
  const col = collection(db, "groups", groupId, "events");

  const oneOff = query(
    col,
    where("start", ">=", rangeStart),
    where("start", "<=", rangeEnd)
  );
  const recurring = query(col, where("recurrence.frequency", "!=", "none"));

  let aEvents: CalendarEvent[] = [];
  let bEvents: CalendarEvent[] = [];

  const emit = () => {
    const map = new Map<string, CalendarEvent>();
    for (const e of [...aEvents, ...bEvents]) map.set(e.id, e);
    cb([...map.values()]);
  };

  const unsubA = onSnapshot(oneOff, (snap) => {
    aEvents = snap.docs.map((d) => d.data() as CalendarEvent);
    emit();
  });
  const unsubB = onSnapshot(recurring, (snap) => {
    bEvents = snap.docs.map((d) => d.data() as CalendarEvent);
    emit();
  });

  return () => {
    unsubA();
    unsubB();
  };
}
