import { describe, expect, it } from "vitest";
import {
  canSendChat,
  getControlAvailability,
  getOverlayKind,
  liveScreenStates,
  normalizeSwipeResult
} from "./liveSession";

describe("liveSession", () => {
  it("defines every required live matching screen state", () => {
    expect(liveScreenStates).toEqual([
      "idle",
      "searching",
      "matched",
      "inSession",
      "timerEnded",
      "partnerLeft",
      "reported",
      "blocked"
    ]);
  });

  it("enables chat only during an active session", () => {
    expect(canSendChat("inSession")).toBe(true);
    expect(canSendChat("idle")).toBe(false);
    expect(canSendChat("searching")).toBe(false);
    expect(canSendChat("timerEnded")).toBe(false);
  });

  it("keeps queue and session controls mutually safe", () => {
    expect(getControlAvailability("idle")).toMatchObject({
      canStart: true,
      canEnd: false,
      canEditPreferences: true
    });
    expect(getControlAvailability("searching")).toMatchObject({
      canStart: false,
      canEnd: true,
      canEditPreferences: false
    });
    expect(getControlAvailability("inSession")).toMatchObject({
      canStart: false,
      canEnd: true,
      canEditPreferences: false
    });
  });

  it("shows the decision overlay only after the timer ends without a result", () => {
    expect(getOverlayKind("timerEnded", null)).toBe("decision");
    expect(getOverlayKind("timerEnded", { type: "request_sent", partnerId: "p1", message: "sent" })).toBe("result");
    expect(getOverlayKind("inSession", null)).toBe("none");
  });

  it("maps backend swipe results to user-facing copy", () => {
    expect(normalizeSwipeResult({ type: "mutual_match", partnerId: "p1", message: "ok" }).title).toBe("It's a match. Chat unlocked.");
    expect(normalizeSwipeResult({ type: "request_sent", partnerId: "p1", message: "ok" }).title).toBe("Request sent.");
    expect(normalizeSwipeResult({ type: "no_match", partnerId: "p1", message: "ok" }).title).toBe("No worries. Find your next vibe?");
  });
});
