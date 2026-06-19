import type { ChatMessage, Friendship, MatchSession, Mode, QueueUser, SwipeChoice, SwipeResultPayload } from "@minutematch/shared";
import { icebreakerFor } from "./icebreakers.js";
import { createId, type MemoryStore, pairKey } from "../storage/memoryStore.js";
import { sharedInterests } from "../matchmaking/matcher.js";
import { resolveSwipeFriendship } from "../social/socialService.js";

export const SESSION_SECONDS = 60;
export const SWIPE_AUTO_LEFT_MS = 20000;

export function createSession(store: MemoryStore, a: QueueUser, b: QueueUser): MatchSession {
  const sharedInterest = sharedInterests(a, b)[0] ?? a.interests[0] ?? b.interests[0] ?? "Conversation";
  const session: MatchSession = {
    id: createId("session"),
    userAId: a.userId,
    userBId: b.userId,
    usersReady: [],
    sharedInterest,
    icebreaker: icebreakerFor(sharedInterest),
    status: "waiting_for_users",
    mode: (a.mode === b.mode ? a.mode : "text") as Mode,
    createdAt: Date.now()
  };
  store.sessions.set(session.id, session);
  store.persistence?.upsertSession(session);
  return session;
}

export function partnerId(session: MatchSession, userId: string): string {
  return session.userAId === userId ? session.userBId : session.userAId;
}

export function submitSwipe(
  store: MemoryStore,
  sessionId: string,
  userId: string,
  choice: SwipeChoice
): (SwipeResultPayload & { type: SwipeResultPayload["type"] }) | { type: "waiting"; message: string } {
  const session = store.sessions.get(sessionId);
  if (!session) return { type: "error", partnerId: "", message: "Session not found." };
  if (![session.userAId, session.userBId].includes(userId)) return { type: "error", partnerId: "", message: "Not part of this session." };

  const swipeKey = `${sessionId}:${userId}`;
  if (!store.swipes.has(swipeKey)) {
    store.swipes.set(swipeKey, { sessionId, userId, choice, createdAt: Date.now() });
  }

  const otherId = partnerId(session, userId);
  const mine = store.swipes.get(swipeKey);
  const theirs = store.swipes.get(`${sessionId}:${otherId}`);
  if (!mine || !theirs) return { type: "waiting", message: "Waiting for partner." };

  return resolveSwipeFriendship(store, {
    requesterId: userId,
    receiverId: otherId,
    requesterChoice: mine.choice,
    receiverChoice: theirs.choice,
    sharedInterest: session.sharedInterest,
    sessionId
  });
}

export function addMessage(store: MemoryStore, roomId: string, senderId: string, senderName: string, body: string, kind: "session" | "friend"): ChatMessage {
  const message: ChatMessage = {
    id: createId("msg"),
    roomId,
    senderId,
    senderName,
    body: body.trim(),
    createdAt: Date.now(),
    kind
  };
  const messages = store.messages.get(roomId) ?? [];
  store.messages.set(roomId, [...messages, message]);
  store.persistence?.upsertMessage(message);
  const guardHistory = store.messageHistory.get(senderId) ?? [];
  store.messageHistory.set(senderId, [...guardHistory, { body: message.body, createdAt: message.createdAt }]);
  return message;
}

export function acceptedFriendshipFor(store: MemoryStore, friendshipId: string, userId: string): Friendship | null {
  const friendship = store.friendships.get(friendshipId);
  if (!friendship || friendship.status !== "accepted" || !friendship.users.includes(userId)) return null;
  return friendship;
}

export function findAcceptedFriendshipBetween(store: MemoryStore, a: string, b: string): Friendship | null {
  return (
    [...store.friendships.values()].find(
      (friendship) => friendship.status === "accepted" && friendship.users.includes(a) && friendship.users.includes(b)
    ) ?? null
  );
}

export function sortedPairKey(a: string, b: string): string {
  return pairKey(a, b);
}
