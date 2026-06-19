import { describe, expect, it } from "vitest";
import { blockKey, createMemoryStore, unblockUser } from "../storage/memoryStore.js";
import { findBestMatch } from "../matchmaking/matcher.js";
import { checkMessageGuard } from "../safety/rateLimit.js";
import { submitSwipe } from "../sessions/sessionService.js";
import type { QueueUser, UserProfile } from "@minutematch/shared";

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
    mode: "text",
    safetyAgreed: true,
    createdAt: now,
    status: "active",
    reportCount: 0,
    ...overrides
  };
}

function queueUser(id: string, overrides: Partial<QueueUser> = {}): QueueUser {
  const p = profile(id);
  return {
    userId: p.userId,
    socketId: `${id}-socket`,
    displayName: p.displayName,
    gender: p.gender,
    showMe: p.showMe,
    interests: p.interests,
    language: p.language,
    mode: p.mode,
    joinedAt: now,
    ...overrides
  };
}

describe("matcher", () => {
  it("prefers shared interests and same language while respecting gender preferences", () => {
    const seeker = queueUser("a", { gender: "woman", showMe: "men", interests: ["Coding", "Music"] });
    const weak = queueUser("b", { gender: "man", showMe: "everyone", interests: ["Travel"], language: "Hindi" });
    const strong = queueUser("c", { gender: "man", showMe: "women", interests: ["Coding"], language: "English" });

    const match = findBestMatch(seeker, [weak, strong], new Set(), now);

    expect(match?.userId).toBe("c");
  });

  it("relaxes interest requirements if either user has been waiting for at least WAIT_RELAX_MS", () => {
    // Seeker recently joined, candidate recently joined, no shared interests -> no match
    const seeker = queueUser("a", { interests: ["Coding"], joinedAt: now });
    const freshCandidate = queueUser("b", { interests: ["Music"], joinedAt: now });
    expect(findBestMatch(seeker, [freshCandidate], new Set(), now)).toBeNull();

    // Seeker recently joined, candidate has been waiting 40s, no shared interests -> matches candidate
    const waitingCandidate = queueUser("c", { interests: ["Music"], joinedAt: now - 40000 });
    expect(findBestMatch(seeker, [waitingCandidate], new Set(), now)?.userId).toBe("c");

    // Seeker has been waiting 40s, candidate recently joined, no shared interests -> matches candidate
    const waitingSeeker = queueUser("d", { interests: ["Coding"], joinedAt: now - 40000 });
    expect(findBestMatch(waitingSeeker, [freshCandidate], new Set(), now)?.userId).toBe("b");
  });

  it("never matches blocked users even after waiting", () => {
    const seeker = queueUser("a");
    const blocked = queueUser("b", { interests: ["Music"], joinedAt: now - 120000 });
    const blocks = new Set(["a:b"]);

    const match = findBestMatch(seeker, [blocked], blocks, now + 120000);

    expect(match).toBeNull();
  });

  it("requires exact mode match and prefers the longest waiting compatible user", () => {
    const seeker = queueUser("a", { interests: ["Music"], mode: "text", joinedAt: now });
    const differentMode = queueUser("b", { interests: ["Music"], mode: "video", joinedAt: now - 60000 });
    const recent = queueUser("c", { interests: ["Music"], mode: "text", joinedAt: now - 5000 });
    const patient = queueUser("d", { interests: ["Music"], mode: "text", joinedAt: now - 45000 });

    const match = findBestMatch(seeker, [differentMode, recent, patient], new Set(), now);

    expect(match?.userId).toBe("d");
  });
});

describe("safety guards", () => {
  it("blocks overlong duplicate and burst spam messages", () => {
    const history = Array.from({ length: 10 }, (_, index) => ({
      body: index < 5 ? "same" : `msg-${index}`,
      createdAt: now + index * 500
    }));

    expect(checkMessageGuard("x".repeat(301), [], now + 6000)).toEqual({ ok: false, reason: "Message must be 300 characters or less." });
    expect(checkMessageGuard("same", history, now + 6000)).toEqual({ ok: false, reason: "Slow down. Repeated messages are restricted." });
    expect(checkMessageGuard("fresh", history, now + 6000)).toEqual({ ok: false, reason: "Slow down. Maximum 10 messages per 10 seconds." });
  });
});

describe("sessions and safety state", () => {
  it("creates accepted friendship when both users swipe right", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));
    store.sessions.set("s1", {
      id: "s1",
      userAId: "a",
      userBId: "b",
      usersReady: ["a", "b"],
      sharedInterest: "Music",
      icebreaker: "What is one song you never skip?",
      status: "ended",
      mode: "text",
      createdAt: now,
      startedAt: now,
      endedAt: now + 60000
    });

    expect(submitSwipe(store, "s1", "a", "right").type).toBe("waiting");
    const result = submitSwipe(store, "s1", "b", "right");

    expect(result.type).toBe("mutual_match");
    if (result.type === "waiting") throw new Error("Expected completed swipe result.");
    expect(result.friendship?.status).toBe("accepted");
  });

  it("turns one-sided right into pending request and blocks future reports/rematches", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));
    store.sessions.set("s1", {
      id: "s1",
      userAId: "a",
      userBId: "b",
      usersReady: ["a", "b"],
      sharedInterest: "Music",
      icebreaker: "What is one song you never skip?",
      status: "ended",
      mode: "text",
      createdAt: now
    });

    submitSwipe(store, "s1", "a", "right");
    const result = submitSwipe(store, "s1", "b", "left");

    expect(result.type).toBe("request_sent");
    if (result.type === "waiting") throw new Error("Expected completed swipe result.");
    expect(result.friendship?.status).toBe("pending");

    store.createReport({ reporterId: "a", reportedUserId: "b", sessionId: "s1", reason: "Harassment", details: "unsafe" });

    expect(store.blocks.has("a:b")).toBe(true);
    expect(store.sessions.get("s1")?.status).toBe("reported");
  });

  it("keeps the first swipe decision and ignores duplicate changes", () => {
    const store = createMemoryStore();
    store.users.set("a", profile("a"));
    store.users.set("b", profile("b"));
    store.sessions.set("s1", {
      id: "s1",
      userAId: "a",
      userBId: "b",
      usersReady: ["a", "b"],
      sharedInterest: "Music",
      icebreaker: "What is one song you never skip?",
      status: "ended",
      mode: "text",
      createdAt: now
    });

    submitSwipe(store, "s1", "a", "left");
    submitSwipe(store, "s1", "a", "right");
    const result = submitSwipe(store, "s1", "b", "right");

    expect(result.type).toBe("request_sent");
    if (result.type === "waiting") throw new Error("Expected completed swipe result.");
    expect(result.friendship?.requesterId).toBe("b");
  });

  it("can unblock a user without disturbing other block relationships", () => {
    const store = createMemoryStore();
    store.blocks.add(blockKey("a", "b"));
    store.blocks.add(blockKey("a", "c"));

    unblockUser(store, "a", "b");

    expect(store.blocks.has(blockKey("a", "b"))).toBe(false);
    expect(store.blocks.has(blockKey("a", "c"))).toBe(true);
  });
});
