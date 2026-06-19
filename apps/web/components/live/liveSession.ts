import type { SwipeResultPayload } from "@minutematch/shared";

export type ScreenState =
  | "idle"
  | "searching"
  | "matched"
  | "inSession"
  | "timerEnded"
  | "partnerLeft"
  | "reported"
  | "blocked";

export type LiveScreenState = ScreenState;

export const liveScreenStates: ScreenState[] = [
  "idle",
  "searching",
  "matched",
  "inSession",
  "timerEnded",
  "partnerLeft",
  "reported",
  "blocked"
];

export type OverlayKind = "none" | "decision" | "result";

export type LiveOverlayKind = OverlayKind;

export function canSendChat(state: ScreenState): boolean {
  return state === "inSession";
}

export function getControlAvailability(state: ScreenState) {
  const busy = state === "searching" || state === "matched" || state === "inSession" || state === "timerEnded";
  const inActiveSession = state === "inSession";

  return {
    canStart: !busy,
    canEnd: state !== "idle" && state !== "reported" && state !== "blocked",
    canEditPreferences: !busy,
    canReport: inActiveSession,
    canBlock: inActiveSession
  };
}

export function getOverlayKind(state: ScreenState, swipeResult: SwipeResultPayload | null): OverlayKind {
  if (state !== "timerEnded") return "none";
  return swipeResult ? "result" : "decision";
}

export function normalizeSwipeResult(result: SwipeResultPayload) {
  if (result.type === "mutual_match") {
    return {
      title: "It's a match. Chat unlocked.",
      copy: "You both chose Send Request. Permanent chat is unlocked.",
      description: "You both chose Send Request. Permanent chat is unlocked.",
      tone: "match" as const
    };
  }

  if (result.type === "request_sent") {
    return {
      title: "Request sent.",
      copy: "They will see a pending request if they did not choose you back yet.",
      description: "They will see a pending request if they did not choose you back yet.",
      tone: "request" as const
    };
  }

  if (result.type === "partner_left") {
    return {
      title: "Partner left.",
      copy: "That session closed before a request could complete.",
      description: "That session closed before a request could complete.",
      tone: "neutral" as const
    };
  }

  if (result.type === "error") {
    return {
      title: "Something paused the request.",
      copy: result.message,
      description: result.message,
      tone: "neutral" as const
    };
  }

  return {
    title: "No worries. Find your next vibe?",
    copy: "This round ended without a mutual connection.",
    description: "This round ended without a mutual connection.",
    tone: "neutral" as const
  };
}
