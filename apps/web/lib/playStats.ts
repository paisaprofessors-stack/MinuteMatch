import type { SwipeResultType } from "@minutematch/shared";

export interface PlayStats {
  roundsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  matchesUnlocked: number;
  lastRoundCompletedAt: number | null;
}

export function initialPlayStats(): PlayStats {
  return {
    roundsCompleted: 0,
    currentStreak: 0,
    bestStreak: 0,
    matchesUnlocked: 0,
    lastRoundCompletedAt: null
  };
}

export function recordRoundCompleted(stats: PlayStats, resultType: SwipeResultType, completedAt = Date.now()): PlayStats {
  const currentStreak = stats.currentStreak + 1;
  const matchIncrement = resultType === "mutual_match" ? 1 : 0;

  return {
    roundsCompleted: stats.roundsCompleted + 1,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    matchesUnlocked: stats.matchesUnlocked + matchIncrement,
    lastRoundCompletedAt: completedAt
  };
}

export function recordRoundAbandoned(stats: PlayStats): PlayStats {
  return {
    ...stats,
    currentStreak: 0
  };
}

export function parsePlayStats(raw: string | null): PlayStats {
  if (!raw) return initialPlayStats();
  try {
    const parsed = JSON.parse(raw) as Partial<PlayStats>;
    return {
      roundsCompleted: Number(parsed.roundsCompleted ?? 0),
      currentStreak: Number(parsed.currentStreak ?? 0),
      bestStreak: Number(parsed.bestStreak ?? 0),
      matchesUnlocked: Number(parsed.matchesUnlocked ?? 0),
      lastRoundCompletedAt: typeof parsed.lastRoundCompletedAt === "number" ? parsed.lastRoundCompletedAt : null
    };
  } catch {
    return initialPlayStats();
  }
}
