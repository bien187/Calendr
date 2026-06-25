import "server-only";
import {
  getApps,
  initializeApp,
  cert,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

/**
 * Initialise the Firebase Admin SDK from a service-account key supplied via
 * env. Accepts either raw JSON or base64-encoded JSON in
 * FIREBASE_SERVICE_ACCOUNT (base64 avoids newline issues in some env UIs).
 */
function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
  const json = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
}

let app: App | undefined;

export function getAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  const sa = loadServiceAccount();
  app = initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      // env stores escaped newlines — restore them
      privateKey: sa.private_key.replace(/\\n/g, "\n"),
    }),
  });
  return app;
}

export const adminDb = () => getFirestore(getAdminApp());
export const adminMessaging = () => getMessaging(getAdminApp());
