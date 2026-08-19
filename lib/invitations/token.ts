import "server-only";
import { randomBytes, createHash } from "crypto";

/**
 * Invitation token handling. The raw token is a URL-safe random string emailed
 * to the buyer; only its SHA-256 hash is stored. Lookups hash the incoming
 * token and compare, so the raw token never touches the database.
 */

export function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashInviteToken(raw) };
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Invitations are valid for 14 days. */
export const INVITE_TTL_DAYS = 14;

export function inviteExpiryDate(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + INVITE_TTL_DAYS);
  return d;
}
