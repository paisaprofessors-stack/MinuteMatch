import type { FriendCallRequest, Mode } from "@minutematch/shared";
import { blockKey, createId, type MemoryStore } from "../storage/memoryStore.js";

const CALL_REQUEST_TTL_MS = 45 * 1000;

type CallResult = { ok: true; call: FriendCallRequest } | { ok: false; message: string };

function activeUser(store: MemoryStore, userId: string): boolean {
  return store.users.get(userId)?.status === "active";
}

function expireIfNeeded(store: MemoryStore, call: FriendCallRequest, now: number): void {
  if (call.status === "pending" && call.expiresAt <= now) {
    call.status = "expired";
    call.endedAt = now;
    store.persistence?.upsertCallRequest(call);
  }
}

function acceptedFriendshipUsers(store: MemoryStore, friendshipId: string): [string, string] | null {
  const friendship = store.friendships.get(friendshipId);
  if (!friendship || friendship.status !== "accepted") return null;
  return friendship.users;
}

export function createFriendCallRequest(
  store: MemoryStore,
  friendshipId: string,
  requesterId: string,
  mode: Exclude<Mode, "text">,
  now = Date.now()
): CallResult {
  const users = acceptedFriendshipUsers(store, friendshipId);
  if (!users || !users.includes(requesterId)) return { ok: false, message: "Calls require an accepted friendship." };
  const receiverId = users.find((id) => id !== requesterId) ?? "";
  if (!activeUser(store, requesterId) || !activeUser(store, receiverId)) {
    return { ok: false, message: "Both friends must be active to start a call." };
  }
  if (store.blocks.has(blockKey(requesterId, receiverId)) || store.blocks.has(blockKey(receiverId, requesterId))) {
    return { ok: false, message: "Calls are unavailable for this connection." };
  }

  for (const call of store.callRequests.values()) {
    expireIfNeeded(store, call, now);
    if (call.friendshipId === friendshipId && (call.status === "pending" || call.status === "accepted")) {
      return { ok: false, message: "A call is already active or waiting for this friend." };
    }
  }

  const call: FriendCallRequest = {
    id: createId("call"),
    friendshipId,
    requesterId,
    receiverId,
    mode,
    status: "pending",
    createdAt: now,
    expiresAt: now + CALL_REQUEST_TTL_MS
  };
  store.callRequests.set(call.id, call);
  store.persistence?.upsertCallRequest(call);
  return { ok: true, call };
}

export function acceptFriendCallRequest(store: MemoryStore, callRequestId: string, actorId: string, now = Date.now()): CallResult {
  const call = store.callRequests.get(callRequestId);
  if (!call) return { ok: false, message: "Call request not found." };
  expireIfNeeded(store, call, now);
  if (call.status !== "pending") return { ok: false, message: "This call request is no longer available." };
  if (call.receiverId !== actorId) return { ok: false, message: "Only the receiver can accept this call." };
  if (!activeUser(store, call.requesterId) || !activeUser(store, call.receiverId)) {
    return { ok: false, message: "Both friends must be active to start a call." };
  }
  call.status = "accepted";
  call.acceptedAt = now;
  call.roomId = `friend-call:${call.id}`;
  const requesterPresence = store.presence.get(call.requesterId);
  const receiverPresence = store.presence.get(call.receiverId);
  if (requesterPresence) requesterPresence.currentCallId = call.id;
  if (receiverPresence) receiverPresence.currentCallId = call.id;
  if (requesterPresence) store.persistence?.upsertPresence(requesterPresence);
  if (receiverPresence) store.persistence?.upsertPresence(receiverPresence);
  store.persistence?.upsertCallRequest(call);
  return { ok: true, call };
}

export function declineFriendCallRequest(store: MemoryStore, callRequestId: string, actorId: string, now = Date.now()): CallResult {
  const call = store.callRequests.get(callRequestId);
  if (!call) return { ok: false, message: "Call request not found." };
  expireIfNeeded(store, call, now);
  if (call.status !== "pending") return { ok: false, message: "This call request is no longer available." };
  if (call.receiverId !== actorId && call.requesterId !== actorId) {
    return { ok: false, message: "You are not part of this call request." };
  }
  call.status = call.receiverId === actorId ? "declined" : "cancelled";
  call.declinedAt = call.receiverId === actorId ? now : undefined;
  call.endedAt = now;
  store.persistence?.upsertCallRequest(call);
  return { ok: true, call };
}

export function endFriendCall(store: MemoryStore, callRequestId: string, actorId: string, now = Date.now()): CallResult {
  const call = store.callRequests.get(callRequestId);
  if (!call) return { ok: false, message: "Call request not found." };
  if (![call.requesterId, call.receiverId].includes(actorId)) return { ok: false, message: "You are not part of this call." };
  if (call.status === "accepted" || call.status === "pending") {
    call.status = "cancelled";
    call.endedAt = now;
    store.persistence?.upsertCallRequest(call);
  }
  for (const userId of [call.requesterId, call.receiverId]) {
    const presence = store.presence.get(userId);
    if (presence?.currentCallId === call.id) presence.currentCallId = undefined;
    if (presence) store.persistence?.upsertPresence(presence);
  }
  return { ok: true, call };
}

export function canSignalFriendCall(store: MemoryStore, callRequestId: string, userId: string): FriendCallRequest | null {
  const call = store.callRequests.get(callRequestId);
  if (!call || call.status !== "accepted" || ![call.requesterId, call.receiverId].includes(userId)) return null;
  return call;
}
