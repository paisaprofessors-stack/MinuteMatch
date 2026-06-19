import type { ModerationFilterResult } from "@minutematch/shared";

const CONTACT_WARNING =
  "For safety, sharing phone numbers, emails, social handles, invite links, or external contact details is not allowed.";

const PLATFORM_WORDS = [
  "whatsapp",
  "telegram",
  "instagram",
  "insta",
  "snapchat",
  "snap",
  "discord",
  "facebook",
  "signal",
  "phone",
  "number",
  "email",
  "gmail",
  "g mail",
  "call me",
  "text me",
  "dm me"
];

const URL_OR_INVITE_PATTERNS = [
  /\bhttps?:\/\//i,
  /\bwww\./i,
  /\b[a-z0-9-]+\.(com|in|net|org|io|me|gg|co)\b/i,
  /\bwa\.me\b/i,
  /\bt\.me\b/i,
  /\bdiscord\.gg\b/i,
  /\binstagram\.com\b/i
];

const NUMBER_WORDS = /\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b/gi;

function digitCount(text: string): number {
  return (text.match(/\d/g) ?? []).length;
}

function numberWordCount(text: string): number {
  return (text.match(NUMBER_WORDS) ?? []).length;
}

function hasPhoneLikeSequence(text: string): boolean {
  const compactDigits = text.replace(/[^\d]/g, "");
  if (compactDigits.length >= 10) return true;

  const separated = text.match(/(?:\d[\s().+-]*){8,}/g) ?? [];
  return separated.some((chunk) => digitCount(chunk) >= 8);
}

function hasEmail(text: string): boolean {
  return /[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i.test(text);
}

function hasPlatformHandle(text: string): boolean {
  const hasHandle = /(^|\s)@[a-z0-9._-]{3,}/i.test(text);
  const lower = text.toLowerCase();
  return hasHandle && PLATFORM_WORDS.some((word) => lower.includes(word));
}

function hasContactKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return PLATFORM_WORDS.some((word) => lower.includes(word));
}

export function filterContactSharing(body: string): ModerationFilterResult {
  const normalized = body.trim().replace(/\s+/g, " ");
  if (!normalized) return { ok: true };

  if (hasEmail(normalized)) return { ok: false, code: "contact_sharing", reason: CONTACT_WARNING };
  if (hasPhoneLikeSequence(normalized)) return { ok: false, code: "contact_sharing", reason: CONTACT_WARNING };
  if (numberWordCount(normalized) >= 5) return { ok: false, code: "contact_sharing", reason: CONTACT_WARNING };
  if (URL_OR_INVITE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { ok: false, code: "contact_sharing", reason: CONTACT_WARNING };
  }
  if (hasPlatformHandle(normalized)) return { ok: false, code: "contact_sharing", reason: CONTACT_WARNING };
  if (/\bg\s*mail\b/i.test(normalized)) return { ok: false, code: "contact_sharing", reason: CONTACT_WARNING };
  if (hasContactKeyword(normalized) && (digitCount(normalized) >= 4 || normalized.includes("@"))) {
    return { ok: false, code: "contact_sharing", reason: CONTACT_WARNING };
  }

  return { ok: true };
}

export function recordContactViolation(userId: string, histories: Map<string, number[]>, mutedUntil: Map<string, number>, now = Date.now()): void {
  const recent = (histories.get(userId) ?? []).filter((time) => now - time < 15 * 60 * 1000);
  const next = [...recent, now];
  histories.set(userId, next);
  if (next.length >= 3) {
    mutedUntil.set(userId, now + 5 * 60 * 1000);
  }
}
