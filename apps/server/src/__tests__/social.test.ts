import { describe, expect, it } from "vitest";
import type { UserProfile } from "@minutematch/shared";
import { createMemoryStore } from "../storage/memoryStore.js";
import { filterContactSharing } from "../safety/contactSafety.js";
import {
  acceptFriendship,
  createFriendRequest,
  declineFriendship,
  listSocialGraph,
  resolveSwipeFriendship
} from "../social/socialService.js";
import { createFriendCallRequest, acceptFriendCallRequest, declineFriendCallRequest } from "../calls/callService.js";
import { createFriendMessage } from "../messages/messageService.js";

const now = 1710000000000;

function profile(id: string, overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    userId: id,
    displayName: id.toUpperCase(),
    ageConfirmed: true,
    gender: "man",
    showMe: "everyone",
    interests: ["Music"],
    language: "English",
    mode: "video",
    safetyAgreed: true,
    createdAt: now,
    status: "active",
    reportCount: 0,
    ...overrides
  };
}

describe("contact safety", () => {
  it("blocks phone numbers emails handles and invite links before messages are saved", () => {
    const unsafeBodies = [
      "my number is 98765 43210",
      "mail me at hello@example.com",
      "insta @cool_person",
      "join discord.gg/room",
      "message me on wa.me/919876543210",
      "g mail is my name",
      "nine eight seven six five four three two one zero"
    ];

    for (const body of unsafeBodies) {
      expect(filterContactSharing(body).ok).toBe(false);
    }
  });

  it("allows ordinary friendly messages", () => {
    expect(filterContactSharing("That song is great, what else do you listen to?")).toEqual({ ok: true });
  });
});

describe("social graph", () => {
  it("accepts a pending friend request and unlocks friend chat", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));
    const pending = createFriendRequest(store, "a", "b", "Music", "session_1", now);

    const accepted = acceptFriendship(store, pending.id, "b", now + 1000);
    const message = createFriendMessage(store, accepted.id, "a", "hello again", now + 2000);

    expect(accepted.status).toBe("accepted");
    expect(accepted.acceptedAt).toBe(now + 1000);
    expect(message.ok).toBe(true);
    if (message.ok) expect(store.messages.get(accepted.id)?.[0]?.body).toBe("hello again");
  });

  it("declines a pending friend request and keeps chat locked", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));
    const pending = createFriendRequest(store, "a", "b", "Music", "session_1", now);

    const declined = declineFriendship(store, pending.id, "b", now + 1000);
    const message = createFriendMessage(store, declined.id, "a", "still there?", now + 2000);

    expect(declined.status).toBe("declined");
    expect(message.ok).toBe(false);
  });

  it("lists presence only for accepted friends", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));
    store.users.set("c", profile("c"));
    const accepted = acceptFriendship(store, createFriendRequest(store, "a", "b", "Music", undefined, now).id, "b", now);
    createFriendRequest(store, "c", "a", "Travel", undefined, now);
    store.presence.set("b", { userId: "b", online: true, socketId: "socket-b", lastSeenAt: now + 10 });
    store.presence.set("c", { userId: "c", online: true, socketId: "socket-c", lastSeenAt: now + 10 });

    const graph = listSocialGraph(store, "a");

    expect(graph.matches).toEqual([accepted]);
    expect(graph.presence.b?.online).toBe(true);
    expect(graph.presence.c).toBeUndefined();
  });

  it("resolves swipe outcomes through the same friendship service", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));

    const mutual = resolveSwipeFriendship(store, {
      requesterId: "a",
      receiverId: "b",
      requesterChoice: "right",
      receiverChoice: "right",
      sharedInterest: "Music",
      sessionId: "session_1",
      now
    });

    expect(mutual.type).toBe("mutual_match");
    expect(mutual.friendship?.status).toBe("accepted");
  });
});

describe("friend calls", () => {
  it("requires accepted friendship before creating a call request", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));
    const pending = createFriendRequest(store, "a", "b", "Music", "session_1", now);

    const result = createFriendCallRequest(store, pending.id, "a", "video", now);

    expect(result.ok).toBe(false);
  });

  it("starts a friend call only when the receiver accepts", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));
    const accepted = acceptFriendship(store, createFriendRequest(store, "a", "b", "Music", undefined, now).id, "b", now);

    const request = createFriendCallRequest(store, accepted.id, "a", "video", now);
    expect(request.ok).toBe(true);
    if (!request.ok) throw new Error("Expected call request.");

    const acceptedCall = acceptFriendCallRequest(store, request.call.id, "b", now + 1000);

    expect(acceptedCall.ok).toBe(true);
    if (acceptedCall.ok) {
      expect(acceptedCall.call.status).toBe("accepted");
      expect(acceptedCall.call.roomId).toBe(`friend-call:${request.call.id}`);
    }
  });

  it("allows the receiver to decline a pending call request", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));
    const accepted = acceptFriendship(store, createFriendRequest(store, "a", "b", "Music", undefined, now).id, "b", now);
    const request = createFriendCallRequest(store, accepted.id, "a", "audio", now);
    if (!request.ok) throw new Error("Expected call request.");

    const declined = declineFriendCallRequest(store, request.call.id, "b", now + 1000);

    expect(declined.ok).toBe(true);
    if (declined.ok) expect(declined.call.status).toBe("declined");
  });
});
