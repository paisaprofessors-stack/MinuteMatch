import type { StoredMessageForGuard } from "../storage/memoryStore.js";

export interface GuardResult {
  ok: boolean;
  reason?: string;
}

export function trimWindow(values: number[], windowMs: number, now = Date.now()): number[] {
  return values.filter((value) => now - value <= windowMs);
}

export function withinLimit(values: number[], max: number, windowMs: number, now = Date.now()): GuardResult {
  const recent = trimWindow(values, windowMs, now);
  if (recent.length >= max) return { ok: false, reason: "Rate limit reached. Please slow down." };
  return { ok: true };
}

export function checkMessageGuard(body: string, history: StoredMessageForGuard[], now = Date.now()): GuardResult {
  const clean = body.trim();
  if (clean.length === 0) return { ok: false, reason: "Message cannot be empty." };
  if (clean.length > 300) return { ok: false, reason: "Message must be 300 characters or less." };

  const recent = history.filter((message) => now - message.createdAt <= 10000);
  const duplicateCount = recent.filter((message) => message.body.toLowerCase() === clean.toLowerCase()).length;
  if (duplicateCount >= 5) return { ok: false, reason: "Slow down. Repeated messages are restricted." };
  if (recent.length >= 10) return { ok: false, reason: "Slow down. Maximum 10 messages per 10 seconds." };
  return { ok: true };
}

export function pushLimited(history: Map<string, number[]>, userId: string, max: number, windowMs: number, now = Date.now()): GuardResult {
  const current = trimWindow(history.get(userId) ?? [], windowMs, now);
  if (current.length >= max) {
    history.set(userId, current);
    return { ok: false, reason: "Rate limit reached. Please slow down." };
  }
  history.set(userId, [...current, now]);
  return { ok: true };
}
