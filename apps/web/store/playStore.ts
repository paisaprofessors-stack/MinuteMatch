"use client";

import { create } from "zustand";
import type { SwipeResultType } from "@minutematch/shared";
import { initialPlayStats, parsePlayStats, recordRoundAbandoned, recordRoundCompleted, type PlayStats } from "@/lib/playStats";

const key = "minutematch.playStats.v1";

interface PlayState {
  stats: PlayStats;
  hydrate: () => void;
  completeRound: (resultType: SwipeResultType) => void;
  abandonRound: () => void;
  reset: () => void;
}

function persist(stats: PlayStats) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(stats));
  }
}

export const usePlayStore = create<PlayState>((set) => ({
  stats: initialPlayStats(),
  hydrate: () => {
    if (typeof window === "undefined") return;
    set({ stats: parsePlayStats(window.localStorage.getItem(key)) });
  },
  completeRound: (resultType) => {
    set((state) => {
      const stats = recordRoundCompleted(state.stats, resultType);
      persist(stats);
      return { stats };
    });
  },
  abandonRound: () => {
    set((state) => {
      const stats = recordRoundAbandoned(state.stats);
      persist(stats);
      return { stats };
    });
  },
  reset: () => {
    const stats = initialPlayStats();
    persist(stats);
    set({ stats });
  }
}));
