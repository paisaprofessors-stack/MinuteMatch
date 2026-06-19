import type { ChatMessage } from "@minutematch/shared";
import { checkMessageGuard } from "../safety/rateLimit.js";
import { filterContactSharing, recordContactViolation } from "../safety/contactSafety.js";
import { addMessage } from "../sessions/sessionService.js";
import { blockKey, type MemoryStore } from "../storage/memoryStore.js";

type MessageResult = { ok: true; message: ChatMessage } | { ok: false; message: string };

function mutedMessage(store: MemoryStore, userId: string, now: number): string | null {
  const until = store.mutedUntil.get(userId) ?? 0;
  return until > now ? "Messaging is temporarily muted after repeated contact-sharing attempts." : null;
}

function validateBody(store: MemoryStore, userId: string, body: string, now: number): { ok: true } | { ok: false; message: string } {
  const mute = mutedMessage(store, userId, now);
  if (mute) return { ok: false, message: mute };

  const contact = filterContactSharing(body);
  if (!contact.ok) {
    recordContactViolation(userId, store.contactViolations, store.mutedUntil, now);
    store.persistence?.recordContactViolation({ userId, attemptedBody: body, createdAt: now });
    return { ok: false, message: contact.reason ?? "Sharing contact details is not allowed." };
  }

  const guard = checkMessageGuard(body, store.messageHistory.get(userId) ?? [], now);
  if (!guard.ok) return { ok: false, message: guard.reason ?? "Message blocked by safety limits." };

  return { ok: true };
}

export function createSessionMessage(store: MemoryStore, sessionId: string, userId: string, body: string, now = Date.now()): MessageResult {
  const session = store.sessions.get(sessionId);
  const user = store.users.get(userId);
  if (!session || !user || session.status !== "active") {
    return { ok: false, message: "Messages are only available during active sessions." };
  }
  if (![session.userAId, session.userBId].includes(userId)) {
    return { ok: false, message: "You are not part of this session." };
  }
  const validation = validateBody(store, userId, body, now);
  if (!validation.ok) return validation;
  return { ok: true, message: addMessage(store, sessionId, userId, user.displayName, body, "session") };
}

export function createFriendMessage(store: MemoryStore, friendshipId: string, userId: string, body: string, now = Date.now()): MessageResult {
  const friendship = store.friendships.get(friendshipId);
  const user = store.users.get(userId);
  if (!friendship || friendship.status !== "accepted" || !friendship.users.includes(userId) || !user) {
    return { ok: false, message: "Permanent chat requires accepted friendship." };
  }
  const otherId = friendship.users.find((id) => id !== userId) ?? "";
  if (store.blocks.has(blockKey(userId, otherId)) || store.blocks.has(blockKey(otherId, userId))) {
    return { ok: false, message: "Chat is disabled because one user blocked the other." };
  }
  const validation = validateBody(store, userId, body, now);
  if (!validation.ok) return validation;
  return { ok: true, message: addMessage(store, friendshipId, userId, user.displayName, body, "friend") };
}
