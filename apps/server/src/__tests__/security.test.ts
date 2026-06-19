import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../storage/memoryStore.js";
import {
  issueUserToken,
  verifyAdminSecret,
  verifyUserToken,
  requireStrongProductionSecrets
} from "../security/auth.js";

describe("admin security", () => {
  it("rejects default admin credentials in production", () => {
    expect(() =>
      requireStrongProductionSecrets({
        NODE_ENV: "production",
        ADMIN_PASSWORD: "admin123"
      })
    ).toThrow(/ADMIN_PASSWORD/);
  });

  it("checks admin secrets without accepting missing or wrong values", () => {
    expect(verifyAdminSecret("owner-secret", "owner-secret")).toBe(true);
    expect(verifyAdminSecret("owner-secret", "wrong")).toBe(false);
    expect(verifyAdminSecret("owner-secret", "")).toBe(false);
  });
});

describe("user object authorization", () => {
  it("issues an opaque token and rejects access with another token", () => {
    const store = createMemoryStore();
    const alice = issueUserToken(store, "alice");
    const bob = issueUserToken(store, "bob");

    expect(alice.token).not.toBe(bob.token);
    expect(verifyUserToken(store, "alice", alice.token)).toBe(true);
    expect(verifyUserToken(store, "alice", bob.token)).toBe(false);
    expect(verifyUserToken(store, "alice", "")).toBe(false);
  });
});
