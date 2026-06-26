import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
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
 * Subscribe to ALL events in a group. At family scale (hundreds of events)
 * this is cheap and lets the client expand recurrence + render any window
 * (needed for endless scrolling without re-subscribing per scroll).
 */
export function subscribeAllEvents(
  groupId: string,
  cb: (events: CalendarEvent[]) => void
) {
  const col = collection(db, "groups", groupId, "events");
  return onSnapshot(col, (snap) => {
    cb(snap.docs.map((d) => d.data() as CalendarEvent));
  });
}

