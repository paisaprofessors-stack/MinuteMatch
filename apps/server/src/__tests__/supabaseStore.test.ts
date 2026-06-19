import { describe, expect, it, vi } from "vitest";
import type { Friendship, UserProfile } from "@minutematch/shared";
import { createMemoryStore } from "../storage/memoryStore.js";
import {
  createSupabaseRestClient,
  friendshipFromRow,
  friendshipToRow,
  hydrateStoreFromSupabase,
  profileFromRow,
  profileToRow
} from "../storage/supabaseStore.js";

const now = 1710000000000;

function profile(id: string): UserProfile {
  return {
    userId: id,
    displayName: "Avery",
    ageConfirmed: true,
    gender: "woman",
    showMe: "everyone",
    interests: ["Music", "Travel"],
    language: "English",
    mode: "video",
    safetyAgreed: true,
    createdAt: now,
    status: "active",
    reportCount: 2
  };
}

function friendship(): Friendship {
  return {
    id: "friend_1",
    requesterId: "a",
    receiverId: "b",
    users: ["a", "b"],
    status: "accepted",
    sharedInterest: "Music",
    sessionId: "session_1",
    createdAt: now,
    acceptedAt: now + 1,
    updatedAt: now + 2
  };
}

describe("Supabase row mapping", () => {
  it("round-trips user profiles through snake_case rows", () => {
    const row = profileToRow(profile("a"));

    expect(row).toMatchObject({
      user_id: "a",
      display_name: "Avery",
      age_confirmed: true,
      show_me: "everyone",
      report_count: 2,
      updated_at: now
    });
    expect(profileFromRow(row)).toEqual(profile("a"));
  });

  it("round-trips friendships through snake_case rows", () => {
    const row = friendshipToRow(friendship());

    expect(row).toMatchObject({
      id: "friend_1",
      requester_id: "a",
      receiver_id: "b",
      shared_interest: "Music",
      accepted_at: now + 1
    });
    expect(friendshipFromRow(row)).toEqual(friendship());
  });
});

describe("Supabase REST client", () => {
  it("sends service-role upserts to PostgREST", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }));
    const client = createSupabaseRestClient({
      url: "https://project.supabase.co",
      serviceRoleKey: "service-key",
      fetcher
    });

    await client.upsert("users", { user_id: "a", display_name: "Avery" }, "user_id");

    expect(fetcher).toHaveBeenCalledWith(
      "https://project.supabase.co/rest/v1/users?on_conflict=user_id",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "service-key",
          Authorization: "Bearer service-key",
          Prefer: "resolution=merge-duplicates"
        }),
        body: JSON.stringify({ user_id: "a", display_name: "Avery" })
      })
    );
  });

  it("hydrates store maps from persisted rows", async () => {
    const store = createMemoryStore();
    const client = {
      select: vi.fn(async (table: string) => {
        if (table === "users") return [profileToRow(profile("a"))];
        if (table === "friendships") return [friendshipToRow(friendship())];
        return [];
      })
    };

    await hydrateStoreFromSupabase(store, client);

    expect(store.users.get("a")).toEqual(profile("a"));
    expect(store.friendships.get("friend_1")).toEqual(friendship());
  });
});
