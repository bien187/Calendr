"use client";

import { useEffect } from "react";
import { useAuth } from "@/store/useAuth";
import { requestFcmToken } from "@/lib/firebase/messaging";
import { saveFcmToken } from "@/lib/firebase/users";

/**
 * Keeps the user's FCM token registered. When notification permission is
 * already granted, silently fetches a (possibly rotated) token on each app
 * start and persists it — so the reminder cron always has a target. Does NOT
 * prompt; the first opt-in still happens explicitly in Settings.
 */
export function NotificationsSync() {
  const userId = useAuth((s) => s.profile?.userId);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }
    requestFcmToken().then((token) => {
      if (token) saveFcmToken(userId, token).catch(() => {});
    });
  }, [userId]);

  return null;
}
