import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashInviteToken } from "@/lib/invitations/token";
import { formatAddressLine } from "@/lib/format";

export type InvitationView =
  | { valid: false; reason: "not_found" | "expired" | "used" | "revoked" }
  | {
      valid: true;
      invitationId: string;
      transactionId: string;
      role: "buyer" | "co_buyer";
      email: string;
      propertyLabel: string;
      agentName: string;
    };

/**
 * Resolve a raw invite token to a view for the acceptance page. Runs with the
 * service role because the buyer has no session yet; it reads only the single
 * invitation the token unlocks, plus its transaction's public-ish display info.
 */
export async function getInvitationForToken(
  rawToken: string
): Promise<InvitationView> {
  const admin = createAdminClient();
  const tokenHash = hashInviteToken(rawToken);

  const { data: invite } = await admin
    .from("invitations")
    .select("id, transaction_id, role, email, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invite) return { valid: false, reason: "not_found" };
  if (invite.status === "accepted") return { valid: false, reason: "used" };
  if (invite.status === "revoked") return { valid: false, reason: "revoked" };
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { valid: false, reason: "expired" };
  }

  const { data: tx } = await admin
    .from("transactions")
    .select("property_street, property_unit, agent_id")
    .eq("id", invite.transaction_id)
    .maybeSingle();

  const { data: agent } = tx
    ? await admin
        .from("profiles")
        .select("full_name")
        .eq("id", tx.agent_id)
        .maybeSingle()
    : { data: null };

  return {
    valid: true,
    invitationId: invite.id,
    transactionId: invite.transaction_id,
    role: invite.role,
    email: invite.email,
    propertyLabel: tx
      ? formatAddressLine({
          property_street: tx.property_street,
          property_unit: tx.property_unit,
        })
      : "your home purchase",
    agentName: agent?.full_name || "Your agent",
  };
}
