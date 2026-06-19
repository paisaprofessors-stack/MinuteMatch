import { describe, expect, it } from "vitest";
import { initialPlayStats, recordRoundAbandoned, recordRoundCompleted } from "./playStats";

describe("playStats", () => {
  it("increments completed rounds and streak after a finished round", () => {
    const next = recordRoundCompleted(initialPlayStats(), "no_match", 1000);

    expect(next.roundsCompleted).toBe(1);
    expect(next.currentStreak).toBe(1);
    expect(next.bestStreak).toBe(1);
    expect(next.matchesUnlocked).toBe(0);
    expect(next.lastRoundCompletedAt).toBe(1000);
  });

  it("counts mutual matches as unlocked chats", () => {
    const first = recordRoundCompleted(initialPlayStats(), "mutual_match", 1000);
    const second = recordRoundCompleted(first, "mutual_match", 2000);

    expect(second.roundsCompleted).toBe(2);
    expect(second.currentStreak).toBe(2);
    expect(second.bestStreak).toBe(2);
    expect(second.matchesUnlocked).toBe(2);
  });

  it("resets active streak when a queue round is abandoned before completion", () => {
    const active = recordRoundCompleted(initialPlayStats(), "request_sent", 1000);
    const abandoned = recordRoundAbandoned(active);

    expect(abandoned.roundsCompleted).toBe(1);
    expect(abandoned.currentStreak).toBe(0);
    expect(abandoned.bestStreak).toBe(1);
    expect(abandoned.matchesUnlocked).toBe(0);
  });
});
