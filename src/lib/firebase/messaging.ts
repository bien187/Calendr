"use client";

import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { app } from "./client";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Requests notification permission and returns an FCM registration token.
 * Returns null if unsupported, denied, or not configured.
 */
export async function requestFcmToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;
    if (!(await isSupported())) return null;
    if (!VAPID_KEY) {
      console.warn("[fcm] missing NEXT_PUBLIC_FIREBASE_VAPID_KEY");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token ?? null;
  } catch (err) {
    console.error("[fcm] token error", err);
    return null;
  }
}

/** Subscribe to foreground messages. Returns an unsubscribe function. */
export async function onForegroundMessage(
  cb: (payload: { title?: string; body?: string }) => void
) {
  if (typeof window === "undefined") return () => {};
  if (!(await isSupported())) return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    cb({
      title: payload.notification?.title,
      body: payload.notification?.body,
    });
  });
}
