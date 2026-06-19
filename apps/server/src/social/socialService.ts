import type {
  FriendsListPayload,
  Friendship,
  SwipeChoice,
  SwipeResultPayload,
  UserProfile
} from "@minutematch/shared";
import { blockKey, createId, removeFriendshipsBetween, type MemoryStore } from "../storage/memoryStore.js";

function sortedUsers(a: string, b: string): [string, string] {
  return [a, b].sort() as [string, string];
}

export function friendshipBetween(store: MemoryStore, a: string, b: string): Friendship | null {
  return (
    [...store.friendships.values()].find(
      (friendship) => friendship.users.includes(a) && friendship.users.includes(b) && friendship.status !== "declined"
    ) ?? null
  );
}

export function canUsersInteract(store: MemoryStore, a: string, b: string): { ok: true } | { ok: false; message: string } {
  if (a === b) return { ok: false, message: "You cannot connect with yourself." };
  if (store.blocks.has(blockKey(a, b)) || store.blocks.has(blockKey(b, a))) {
    return { ok: false, message: "This interaction is unavailable." };
  }
  const userA = store.users.get(a);
  const userB = store.users.get(b);
  if (!userA || !userB) return { ok: false, message: "User not found." };
  if (userA.status !== "active" || userB.status !== "active") return { ok: false, message: "One of these accounts is restricted." };
  return { ok: true };
}

export function createFriendRequest(
  store: MemoryStore,
  requesterId: string,
  receiverId: string,
  sharedInterest: string,
  sessionId?: string,
  now = Date.now()
): Friendship {
  const existing = friendshipBetween(store, requesterId, receiverId);
  if (existing) {
    if (existing.status === "declined") {
      existing.status = "pending";
      existing.requesterId = requesterId;
      existing.receiverId = receiverId;
      existing.updatedAt = now;
      existing.declinedAt = undefined;
      store.persistence?.upsertFriendship(existing);
    }
    return existing;
  }

  const friendship: Friendship = {
    id: createId("friend"),
    requesterId,
    receiverId,
    users: sortedUsers(requesterId, receiverId),
    status: "pending",
    sharedInterest,
    sessionId,
    createdAt: now,
    updatedAt: now
  };
  store.friendships.set(friendship.id, friendship);
  store.persistence?.upsertFriendship(friendship);
  return friendship;
}

export function acceptFriendship(store: MemoryStore, friendshipId: string, actorId: string, now = Date.now()): Friendship {
  const friendship = store.friendships.get(friendshipId);
  if (!friendship) throw new Error("Friendship not found.");
  if (!friendship.users.includes(actorId)) throw new Error("Not part of this request.");
  const interaction = canUsersInteract(store, friendship.requesterId, friendship.receiverId);
  if (!interaction.ok) throw new Error(interaction.message);
  friendship.status = "accepted";
  friendship.acceptedAt = now;
  friendship.updatedAt = now;
  friendship.declinedAt = undefined;
  store.persistence?.upsertFriendship(friendship);
  return friendship;
}

export function declineFriendship(store: MemoryStore, friendshipId: string, actorId: string, now = Date.now()): Friendship {
  const friendship = store.friendships.get(friendshipId);
  if (!friendship) throw new Error("Friendship not found.");
  if (!friendship.users.includes(actorId)) throw new Error("Not part of this request.");
  friendship.status = "declined";
  friendship.declinedAt = now;
  friendship.updatedAt = now;
  store.persistence?.upsertFriendship(friendship);
  return friendship;
}

export function removeFriendship(store: MemoryStore, friendshipId: string, actorId: string): boolean {
  const friendship = store.friendships.get(friendshipId);
  if (!friendship || !friendship.users.includes(actorId)) return false;
  const deleted = store.friendships.delete(friendshipId);
  if (deleted) store.persistence?.deleteFriendship(friendshipId);
  return deleted;
}

export function listSocialGraph(store: MemoryStore, userId: string): FriendsListPayload {
  const friendships = [...store.friendships.values()].filter((friendship) => friendship.users.includes(userId));
  const matches = friendships.filter((friendship) => friendship.status === "accepted");
  const pendingReceived = friendships.filter((friendship) => friendship.status === "pending" && friendship.receiverId === userId);
  const sentRequests = friendships.filter((friendship) => friendship.status === "pending" && friendship.requesterId === userId);
  const acceptedFriendIds = new Set(matches.flatMap((friendship) => friendship.users.filter((id) => id !== userId)));
  const blocked = [...store.blocks]
    .filter((key) => key.startsWith(`${userId}:`))
    .map((key) => key.split(":")[1])
    .filter(Boolean);

  const visibleUserIds = new Set<string>([userId]);
  for (const friendship of [...matches, ...pendingReceived, ...sentRequests]) {
    for (const id of friendship.users) visibleUserIds.add(id);
  }
  for (const id of blocked) visibleUserIds.add(id);
  const users: Record<string, UserProfile> = Object.fromEntries(
    [...store.users.entries()].filter(([id]) => visibleUserIds.has(id))
  );
  const presence = Object.fromEntries(
    [...store.presence.entries()].filter(([id]) => acceptedFriendIds.has(id) || id === userId)
  );
  const unreadCounts = Object.fromEntries(matches.map((friendship) => [friendship.id, 0]));

  return {
    matches,
    pendingReceived,
    sentRequests,
    blocked,
    users,
    presence,
    unreadCounts
  };
}

export function blockUser(store: MemoryStore, blockerId: string, blockedUserId: string, now = Date.now()): void {
  store.blocks.add(blockKey(blockerId, blockedUserId));
  store.persistence?.upsertBlock({ blockerId, blockedUserId, createdAt: now });
  removeFriendshipsBetween(store, blockerId, blockedUserId);
  for (const call of store.callRequests.values()) {
    if ([call.requesterId, call.receiverId].includes(blockerId) && [call.requesterId, call.receiverId].includes(blockedUserId)) {
      if (call.status === "pending" || call.status === "accepted") {
        call.status = "cancelled";
        call.endedAt = now;
        store.persistence?.upsertCallRequest(call);
      }
    }
  }
}

export function resolveSwipeFriendship(
  store: MemoryStore,
  input: {
    requesterId: string;
    receiverId: string;
    requesterChoice: SwipeChoice;
    receiverChoice: SwipeChoice;
    sharedInterest: string;
    sessionId: string;
    now?: number;
  }
): SwipeResultPayload {
  const now = input.now ?? Date.now();
  if (input.requesterChoice === "right" && input.receiverChoice === "right") {
    const friendship = createFriendRequest(store, input.requesterId, input.receiverId, input.sharedInterest, input.sessionId, now);
    friendship.status = "accepted";
    friendship.acceptedAt = now;
    friendship.updatedAt = now;
    return { type: "mutual_match", friendship, partnerId: input.receiverId, message: "You both connected." };
  }

  if (input.requesterChoice === "right" && input.receiverChoice === "left") {
    const friendship = createFriendRequest(store, input.requesterId, input.receiverId, input.sharedInterest, input.sessionId, now);
    return { type: "request_sent", friendship, partnerId: input.receiverId, message: "Request sent quietly." };
  }

  if (input.requesterChoice === "left" && input.receiverChoice === "right") {
    const friendship = createFriendRequest(store, input.receiverId, input.requesterId, input.sharedInterest, input.sessionId, now);
    return { type: "request_sent", friendship, partnerId: input.receiverId, message: "They sent a request." };
  }

  return { type: "no_match", partnerId: input.receiverId, message: "Session ended." };
}
