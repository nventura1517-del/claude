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

export type TransactionStatus = "active" | "closed" | "cancelled";

export type ParticipantRole =
  | "agent"
  | "buyer"
  | "co_buyer"
  | "lender"
  | "escrow"
  | "title"
  | "seller"
  | "vendor";

export type Transaction = {
  id: string;
  agent_id: string;
  property_street: string;
  property_unit: string | null;
  property_city: string;
  property_state: string;
  property_postal_code: string;
  buyer_name: string | null;
  buyer_email: string | null;
  status: TransactionStatus;
  estimated_closing_date: string | null;
  actual_closing_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Professional = {
  id: string;
  agent_id: string;
  name: string;
  company: string | null;
  category: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Milestone = {
  id: string;
  transaction_id: string;
  template_key: string;
  name: string;
  description: string;
  sequence: number;
  is_complete: boolean;
  needs_attention: boolean;
  due_date: string | null;
  completed_at: string | null;
  responsible_party: string | null;
  created_at: string;
  updated_at: string;
};
