import { describe, it, expect } from "vitest";
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiryDate,
  INVITE_TTL_DAYS,
} from "./token";

describe("invite tokens", () => {
  it("hashes deterministically and matches the generated hash", () => {
    const { raw, hash } = generateInviteToken();
    expect(hashInviteToken(raw)).toBe(hash);
  });

  it("produces a different hash from the raw token (never stored plain)", () => {
    const { raw, hash } = generateInviteToken();
    expect(hash).not.toBe(raw);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generateInviteToken().raw)
    );
    expect(tokens.size).toBe(50);
  });

  it("sets expiry INVITE_TTL_DAYS in the future", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const exp = inviteExpiryDate(from);
    const days = Math.round(
      (exp.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(days).toBe(INVITE_TTL_DAYS);
  });
});
