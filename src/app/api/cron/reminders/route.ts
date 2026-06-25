import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/server/firebaseAdmin";
import { expandEvents } from "@/lib/recurrence";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Look back this far so a delayed/missed cron run still catches due reminders.
const GRACE_MS = 2 * 60 * 60 * 1000; // 2h
// How far ahead to expand recurring events when scanning.
const HORIZON_MS = 26 * 60 * 60 * 1000; // 26h

export async function GET(req: NextRequest) {
  // Auth: GitHub Actions sends `Authorization: Bearer <CRON_SECRET>`.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const now = Date.now();
  let sent = 0;
  let scanned = 0;

  const groups = await db.collection("groups").get();

  for (const groupDoc of groups.docs) {
    const memberIds: string[] = groupDoc.get("memberIds") ?? [];
    if (memberIds.length === 0) continue;

    const tokens = await collectTokens(db, memberIds);
    if (tokens.length === 0) continue;

    const eventsSnap = await db
      .collection("groups")
      .doc(groupDoc.id)
      .collection("events")
      .get();

    const events = eventsSnap.docs.map((d) => d.data() as CalendarEvent);
    const occurrences = expandEvents(events, now - GRACE_MS, now + HORIZON_MS);

    for (const occ of occurrences) {
      scanned++;
      for (const lead of occ.reminders ?? []) {
        const fireAt = occ.occurrenceStart - lead * 60_000;
        // due now (or recently, within grace) and not in the future
        if (fireAt > now || fireAt < now - GRACE_MS) continue;

        const markerId = `${occ.id}_${occ.occurrenceStart}_${lead}`;
        const markerRef = db.collection("sentReminders").doc(markerId);

        // idempotency: create marker; if it already exists, skip.
        try {
          await markerRef.create({ sentAt: now, groupId: groupDoc.id });
        } catch {
          continue; // already sent
        }

        await sendPush(tokens, occ, lead, groupDoc.id);
        sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, scanned, at: now });
}

async function collectTokens(
  db: FirebaseFirestore.Firestore,
  memberIds: string[]
): Promise<string[]> {
  const tokens: string[] = [];
  for (let i = 0; i < memberIds.length; i += 10) {
    const chunk = memberIds.slice(i, i + 10);
    const snap = await db.collection("users").where("userId", "in", chunk).get();
    snap.forEach((u) => tokens.push(...((u.get("fcmTokens") as string[]) ?? [])));
  }
  return [...new Set(tokens)];
}

async function sendPush(
  tokens: string[],
  occ: CalendarEvent & { occurrenceStart: number },
  lead: number,
  groupId: string
) {
  const when = leadLabel(lead);
  try {
    await adminMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: occ.title,
        body: `Erinnerung: ${occ.title} ${when}.`,
      },
      data: {
        groupId,
        eventId: occ.id,
        occStart: String(occ.occurrenceStart),
      },
      webpush: { fcmOptions: { link: "/calendar" } },
    });
  } catch (err) {
    console.error("[cron] send failed", err);
  }
}

function leadLabel(min: number): string {
  if (min >= 1440) return `in ${Math.round(min / 1440)} Tag(en)`;
  if (min >= 60) return `in ${Math.round(min / 60)} Std.`;
  return `in ${min} Min.`;
}
