import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { MemoryStore } from "../storage/memoryStore.js";

export interface IssuedUserToken {
  userId: string;
  token: string;
}

const INSECURE_ADMIN_PASSWORDS = new Set(["", "admin", "admin123", "password", "changeme", "replace-this"]);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyAdminSecret(expected: string | undefined, provided: string | undefined): boolean {
  return safeEqual(expected ?? "", provided ?? "");
}

export function requireStrongProductionSecrets(env: NodeJS.ProcessEnv | Record<string, string | undefined>): void {
  if (env.NODE_ENV !== "production") return;
  const adminPassword = env.ADMIN_PASSWORD ?? "";
  if (INSECURE_ADMIN_PASSWORDS.has(adminPassword) || adminPassword.length < 24) {
    throw new Error("ADMIN_PASSWORD must be a strong production-only secret with at least 24 characters.");
  }
  if (!env.CORS_ORIGIN) {
    throw new Error("CORS_ORIGIN must be set in production.");
  }
}

export function issueUserToken(store: MemoryStore, userId: string): IssuedUserToken {
  const token = randomBytes(32).toString("base64url");
  store.userAuthTokens.set(userId, hashToken(token));
  store.persistence?.upsertUserAuthToken?.(userId, hashToken(token), Date.now());
  return { userId, token };
}

export function ensureUserToken(store: MemoryStore, userId: string, providedToken?: string): IssuedUserToken | null {
  const existingHash = store.userAuthTokens.get(userId);
  if (!existingHash) return issueUserToken(store, userId);
  return verifyUserToken(store, userId, providedToken) ? { userId, token: providedToken ?? "" } : null;
}

export function verifyUserToken(store: MemoryStore, userId: string, token: string | undefined): boolean {
  const expectedHash = store.userAuthTokens.get(userId);
  if (!expectedHash || !token) return false;
  return safeEqual(expectedHash, hashToken(token));
}
