/**
 * App-level domain types. These are hand-maintained for now; once the Supabase
 * project exists, generate DB types with `supabase gen types typescript` and
 * import from there instead.
 */

export type Role =
  "agent" | "buyer" | "lender" | "escrow" | "title" | "seller" | "vendor";

/** Roles a user can actually sign up as in V1. */
export const SIGNUP_ROLES = ["agent", "buyer"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: Role;
  created_at: string;
};
