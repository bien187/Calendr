import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./client";
import type { UserProfile } from "@/lib/types";

const DEFAULT_REMINDERS = [60]; // 1 hour before

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const profile: UserProfile = {
    userId: user.uid,
    name: user.displayName ?? user.email?.split("@")[0] ?? "Mitglied",
    email: user.email ?? "",
    avatar: user.photoURL ?? null,
    groupIds: [],
    createdAt: Date.now(),
    notificationDefaults: DEFAULT_REMINDERS,
    fcmTokens: [],
  };
  await setDoc(ref, profile);
  return profile;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
) {
  await updateDoc(doc(db, "users", userId), data);
}

export async function saveFcmToken(userId: string, token: string) {
  await updateDoc(doc(db, "users", userId), {
    fcmTokens: arrayUnion(token),
  });
}
