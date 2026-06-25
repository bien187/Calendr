/**
 * Firestore data model for Calendr.
 *
 * users/{userId}
 * groups/{groupId}
 * groups/{groupId}/members/{userId}
 * groups/{groupId}/subgroups/{subgroupId}
 * groups/{groupId}/events/{eventId}
 */

export type Role = "admin" | "member";

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  /** group ids the user belongs to, for fast lookup */
  groupIds: string[];
  createdAt: number;
  /** notification lead times in minutes the user wants by default */
  notificationDefaults: number[];
  /** FCM registration tokens, keyed per device */
  fcmTokens?: string[];
}

export interface Group {
  id: string;
  name: string;
  emoji?: string;
  createdBy: string;
  /** denormalised member ids for array-contains queries */
  memberIds: string[];
  inviteToken: string;
  createdAt: number;
}

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: Role;
  joinedAt: number;
}

/** Subgroups are assignable tags (people / categories) — not joinable. */
export interface Subgroup {
  id: string;
  name: string;
  color: string; // hex
  createdAt: number;
}

export type RecurrenceFrequency = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // every N units
  endDate?: number | null; // epoch ms, optional
}

export interface CalendarEvent {
  id: string;
  groupId: string;
  title: string;
  /** epoch ms of the event start (date or date-time) */
  start: number;
  /** epoch ms of the event end */
  end: number;
  allDay: boolean;
  location?: string | null;
  mapLink?: string | null;
  description?: string | null;
  recurrence: RecurrenceRule;
  /** subgroup ids this event is assigned to */
  assignedSubgroups: string[];
  /** optional explicit color override (hex), otherwise derived from subgroup */
  color?: string | null;
  /** reminder lead times in minutes before start */
  reminders: number[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type CalendarView = "month" | "week" | "agenda";

/** A concrete, materialised occurrence of an event (after recurrence expansion). */
export interface EventOccurrence extends CalendarEvent {
  occurrenceStart: number;
  occurrenceEnd: number;
  /** stable key combining event id + occurrence start */
  occurrenceKey: string;
}
