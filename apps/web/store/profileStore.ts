"use client";

import { create } from "zustand";
import type { UserProfile } from "@minutematch/shared";

interface ProfileState {
  profile: UserProfile | null;
  authToken: string | null;
  xp: number;
  streak: number;
  lastMatchDate: string | null;
  hydrate: () => void;
  save: (profile: UserProfile) => void;
  setAuthToken: (token: string) => void;
  authHeaders: () => Record<string, string>;
  clear: () => void;
  addXP: (amount: number) => void;
  checkStreak: () => void;
}

const key = "minutematch.profile";
const tokenKey = "minutematch.profile.authToken";
const xpKey = "minutematch.profile.xp";
const streakKey = "minutematch.profile.streak";
const lastMatchKey = "minutematch.profile.lastMatchDate";

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  authToken: null,
  xp: 0,
  streak: 0,
  lastMatchDate: null,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(key);
    const authToken = window.localStorage.getItem(tokenKey);
    const xpVal = window.localStorage.getItem(xpKey);
    const streakVal = window.localStorage.getItem(streakKey);
    const lastMatchVal = window.localStorage.getItem(lastMatchKey);
    
    set({
      profile: raw ? (JSON.parse(raw) as UserProfile) : null,
      authToken,
      xp: xpVal ? parseInt(xpVal, 10) : 0,
      streak: streakVal ? parseInt(streakVal, 10) : 0,
      lastMatchDate: lastMatchVal,
    });
  },
  save: (profile) => {
    window.localStorage.setItem(key, JSON.stringify(profile));
    set({ profile });
  },
  setAuthToken: (authToken) => {
    window.localStorage.setItem(tokenKey, authToken);
    set({ authToken });
  },
  authHeaders: () => {
    const state = get();
    return (state.profile?.userId && state.authToken
      ? { "x-user-id": state.profile.userId, "x-user-token": state.authToken }
      : {}) as Record<string, string>;
  },
  clear: () => {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(tokenKey);
    window.localStorage.removeItem(xpKey);
    window.localStorage.removeItem(streakKey);
    window.localStorage.removeItem(lastMatchKey);
    set({ profile: null, authToken: null, xp: 0, streak: 0, lastMatchDate: null });
  },
  addXP: (amount) => {
    const nextXP = get().xp + amount;
    window.localStorage.setItem(xpKey, nextXP.toString());
    set({ xp: nextXP });
  },
  checkStreak: () => {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    const lastDate = get().lastMatchDate;
    
    if (lastDate === today) return; // already recorded today
    
    let nextStreak = get().streak;
    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (lastDate === yesterdayStr) {
        nextStreak += 1;
      } else {
        nextStreak = 1; // streak broke, reset
      }
    } else {
      nextStreak = 1; // first streak
    }
    
    window.localStorage.setItem(streakKey, nextStreak.toString());
    window.localStorage.setItem(lastMatchKey, today);
    set({ streak: nextStreak, lastMatchDate: today });
  }
}));
