import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";
import { db } from "./client";
import { uid } from "@/lib/utils";
import { nextColor } from "@/lib/colors";
import type { Group, GroupMember, Subgroup, UserProfile } from "@/lib/types";

function makeInviteToken() {
  return uid() + uid();
}

/* ───────────────────────── Groups ───────────────────────── */

export async function createGroup(
  owner: UserProfile,
  name: string,
  emoji?: string
): Promise<string> {
  const groupRef = doc(collection(db, "groups"));
  const group: Group = {
    id: groupRef.id,
    name: name.trim(),
    emoji: emoji ?? "👥",
    createdBy: owner.userId,
    memberIds: [owner.userId],
    inviteToken: makeInviteToken(),
    createdAt: Date.now(),
  };

  const batch = writeBatch(db);
  batch.set(groupRef, group);
  batch.set(doc(db, "groups", group.id, "members", owner.userId), {
    userId: owner.userId,
    name: owner.name,
    email: owner.email,
    avatar: owner.avatar ?? null,
    role: "admin",
    joinedAt: Date.now(),
  } satisfies GroupMember);
  batch.update(doc(db, "users", owner.userId), {
    groupIds: arrayUnion(group.id),
  });
  await batch.commit();

  // seed a couple of starter subgroups so the calendar is useful immediately
  await Promise.all([
    addSubgroup(group.id, owner.name.split(" ")[0] || "Ich", 0),
    addSubgroup(group.id, "Haushalt", 1),
  ]);

  return group.id;
}

/** Live subscription to all groups the user is a member of. */
export function subscribeUserGroups(
  userId: string,
  cb: (groups: Group[]) => void
) {
  const q = query(
    collection(db, "groups"),
    where("memberIds", "array-contains", userId)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Group));
  });
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, "groups", groupId));
  return snap.exists() ? (snap.data() as Group) : null;
}

export async function getGroupByInviteToken(
  token: string
): Promise<Group | null> {
  const q = query(collection(db, "groups"), where("inviteToken", "==", token));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as Group);
}

export async function renameGroup(groupId: string, name: string, emoji?: string) {
  await updateDoc(doc(db, "groups", groupId), {
    name: name.trim(),
    ...(emoji ? { emoji } : {}),
  });
}

export async function regenerateInviteToken(groupId: string) {
  const token = makeInviteToken();
  await updateDoc(doc(db, "groups", groupId), { inviteToken: token });
  return token;
}

/* ───────────────────────── Members ───────────────────────── */

export async function joinGroup(group: Group, user: UserProfile) {
  if (group.memberIds.includes(user.userId)) return;
  const batch = writeBatch(db);
  batch.update(doc(db, "groups", group.id), {
    memberIds: arrayUnion(user.userId),
  });
  batch.set(doc(db, "groups", group.id, "members", user.userId), {
    userId: user.userId,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    role: "member",
    joinedAt: Date.now(),
  } satisfies GroupMember);
  batch.update(doc(db, "users", user.userId), {
    groupIds: arrayUnion(group.id),
  });
  await batch.commit();
}

export async function leaveGroup(groupId: string, userId: string) {
  const batch = writeBatch(db);
  batch.update(doc(db, "groups", groupId), {
    memberIds: arrayRemove(userId),
  });
  batch.delete(doc(db, "groups", groupId, "members", userId));
  batch.update(doc(db, "users", userId), {
    groupIds: arrayRemove(groupId),
  });
  await batch.commit();
}

export function subscribeMembers(
  groupId: string,
  cb: (members: GroupMember[]) => void
) {
  return onSnapshot(collection(db, "groups", groupId, "members"), (snap) => {
    cb(snap.docs.map((d) => d.data() as GroupMember));
  });
}

export async function setMemberRole(
  groupId: string,
  userId: string,
  role: "admin" | "member"
) {
  await updateDoc(doc(db, "groups", groupId, "members", userId), { role });
}

/* ───────────────────────── Subgroups ───────────────────────── */

export async function addSubgroup(
  groupId: string,
  name: string,
  indexForColor: number,
  color?: string
): Promise<string> {
  const ref = doc(collection(db, "groups", groupId, "subgroups"));
  const sub: Subgroup = {
    id: ref.id,
    name: name.trim(),
    color: color ?? nextColor(indexForColor),
    createdAt: Date.now(),
  };
  await setDoc(ref, sub);
  return ref.id;
}

export function subscribeSubgroups(
  groupId: string,
  cb: (subgroups: Subgroup[]) => void
) {
  return onSnapshot(collection(db, "groups", groupId, "subgroups"), (snap) => {
    cb(
      snap.docs
        .map((d) => d.data() as Subgroup)
        .sort((a, b) => a.createdAt - b.createdAt)
    );
  });
}

export async function updateSubgroup(
  groupId: string,
  subgroupId: string,
  data: Partial<Subgroup>
) {
  await updateDoc(doc(db, "groups", groupId, "subgroups", subgroupId), data);
}

export async function deleteSubgroup(groupId: string, subgroupId: string) {
  await deleteDoc(doc(db, "groups", groupId, "subgroups", subgroupId));
}
