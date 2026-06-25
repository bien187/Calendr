"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "./client";
import { ensureUserProfile } from "./users";

export async function registerWithEmail(
  name: string,
  email: string,
  password: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

/** Map Firebase error codes to friendly German messages. */
export function authErrorMessage(err: unknown): string {
  const code =
    typeof err === "object" && err && "code" in err
      ? String((err as { code: string }).code)
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-Mail oder Passwort ist falsch.";
    case "auth/email-already-in-use":
      return "Diese E-Mail wird bereits verwendet.";
    case "auth/weak-password":
      return "Passwort muss mindestens 6 Zeichen haben.";
    case "auth/invalid-email":
      return "Ungültige E-Mail-Adresse.";
    case "auth/popup-closed-by-user":
      return "Anmeldung abgebrochen.";
    default:
      return "Etwas ist schiefgelaufen. Bitte erneut versuchen.";
  }
}
