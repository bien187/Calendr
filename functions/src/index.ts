import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { occurrencesInWindow, EventDoc } from "./recurrence";

initializeApp();
const db = getFirestore();

const TICK_MINUTES = 5; // must match the schedule below

/**
 * Runs every 5 minutes. For each group, expands events over the next 24h and
 * fires push notifications whose reminder time falls inside this tick window.
 *
 * Idempotency note: the [now, now+TICK) window combined with a fixed cadence
 * means each reminder fires once. For exactly-once guarantees under retries,
 * persist a `sentReminders/{eventId}_{occ}_{minutes}` marker doc.
 */
export const sendEventReminders = onSchedule(
  { schedule: `every ${TICK_MINUTES} minutes`, timeZone: "Europe/Berlin" },
  async () => {
    const now = Date.now();
    const tickEnd = now + TICK_MINUTES * 60_000;
    const horizon = now + 24 * 60 * 60_000;

    const groups = await db.collection("groups").get();

    for (const groupDoc of groups.docs) {
      const group = groupDoc.data();
      const memberIds: string[] = group.memberIds ?? [];
      if (memberIds.length === 0) continue;

      // collect member FCM tokens
      const tokens = await collectTokens(memberIds);
      if (tokens.length === 0) continue;

      const eventsSnap = await db
        .collection("groups")
        .doc(groupDoc.id)
        .collection("events")
        .get();

      for (const evDoc of eventsSnap.docs) {
        const ev = evDoc.data() as EventDoc;
        const reminders: number[] = ev.reminders ?? [];
        if (reminders.length === 0) continue;

        const occs = occurrencesInWindow(ev, now, horizon);
        for (const occStart of occs) {
          for (const lead of reminders) {
            const fireAt = occStart - lead * 60_000;
            if (fireAt >= now && fireAt < tickEnd) {
              await send(tokens, ev, occStart, lead, groupDoc.id);
            }
          }
        }
      }
    }
  }
);

async function collectTokens(memberIds: string[]): Promise<string[]> {
  const tokens: string[] = [];
  // Firestore "in" supports up to 30 ids; chunk to be safe.
  for (let i = 0; i < memberIds.length; i += 10) {
    const chunk = memberIds.slice(i, i + 10);
    const snap = await db
      .collection("users")
      .where("userId", "in", chunk)
      .get();
    snap.forEach((u) => {
      const list: string[] = u.data().fcmTokens ?? [];
      tokens.push(...list);
    });
  }
  return [...new Set(tokens)];
}

async function send(
  tokens: string[],
  ev: EventDoc,
  occStart: number,
  lead: number,
  groupId: string
) {
  const when = leadLabel(lead);
  try {
    const res = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: ev.title,
        body: `Erinnerung: ${ev.title} ${when}.`,
      },
      data: { groupId, eventId: ev.id, occStart: String(occStart) },
      webpush: { fcmOptions: { link: "/calendar" } },
    });
    logger.info(`reminder "${ev.title}" → ${res.successCount}/${tokens.length}`);
  } catch (err) {
    logger.error("send failed", err);
  }
}

function leadLabel(min: number): string {
  if (min >= 1440) return `in ${Math.round(min / 1440)} Tag(en)`;
  if (min >= 60) return `in ${Math.round(min / 60)} Std.`;
  return `in ${min} Min.`;
}
