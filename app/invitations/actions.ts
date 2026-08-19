"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiryDate,
} from "@/lib/invitations/token";
import { getInvitationForToken } from "@/lib/data/invitations";
import { sendEmail } from "@/lib/email/send";
import { invitationEmail } from "@/lib/email/templates";
import { formatAddressLine } from "@/lib/format";
import { APP_URL } from "@/lib/constants";

export type InviteState = {
  error: string | null;
  notice?: string;
  inviteUrl?: string;
};

// -------------------------------------------------------------------------
// Agent creates an invitation
// -------------------------------------------------------------------------

export async function createInvitationAction(
  _prev: InviteState,
  formData: FormData
): Promise<InviteState> {
  const agent = await requireRole(["agent"]);
  const supabase = await createClient();

  const transactionId = String(formData.get("transaction_id") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!transactionId) return { error: "Missing transaction." };
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid buyer email." };
  }

  // Confirm the agent owns this transaction and get the property label.
  const { data: tx } = await supabase
    .from("transactions")
    .select("id, property_street, property_unit, agent_id")
    .eq("id", transactionId)
    .maybeSingle();

  if (!tx || tx.agent_id !== agent.id) {
    return { error: "You don't have access to that transaction." };
  }

  const { raw, hash } = generateInviteToken();
  const expiresAt = inviteExpiryDate();

  // RLS insert policy requires the caller to be the transaction agent.
  const { error: insertError } = await supabase.from("invitations").insert({
    transaction_id: transactionId,
    email,
    role: "buyer",
    token_hash: hash,
    invited_by: agent.id,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    return { error: "Could not create the invitation. Please try again." };
  }

  const propertyLabel = formatAddressLine({
    property_street: tx.property_street,
    property_unit: tx.property_unit,
  });
  const { subject, html, text } = invitationEmail({
    agentName: agent.full_name || "Your agent",
    propertyLabel,
    acceptUrl: `${APP_URL}/invite/${raw}`,
  });
  const inviteUrl = `${APP_URL}/invite/${raw}`;
  const { delivered } = await sendEmail({ to: email, subject, html, text });

  revalidatePath(`/transactions/${transactionId}`);
  return {
    error: null,
    notice: delivered
      ? `Invitation emailed to ${email}. You can also copy the link below to share directly.`
      : `Invitation ready. Copy the link below and send it to ${email} (email isn't set up yet).`,
    inviteUrl,
  };
}

// -------------------------------------------------------------------------
// Buyer accepts an invitation
// -------------------------------------------------------------------------

export async function acceptInvitationAction(
  _prev: InviteState,
  formData: FormData
): Promise<InviteState> {
  const token = String(formData.get("token") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const view = await getInvitationForToken(token);
  if (!view.valid) {
    return { error: "This invitation link is no longer valid." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // Who is accepting? Either an already-signed-in user, or a new signup.
  let profileId: string | null = null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    profileId = user.id;
  } else {
    if (!email || !email.includes("@")) {
      return { error: "Enter your email." };
    }
    if (password.length < 8) {
      return { error: "Choose a password of at least 8 characters." };
    }

    // Create the buyer with a confirmed email (they arrived via a trusted
    // emailed link), then sign them in to establish a session.
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "buyer" },
      });

    if (createError || !created.user) {
      return {
        error:
          "We couldn't create your account. If you already have one, sign in first, then open the link again.",
      };
    }
    profileId = created.user.id;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return { error: "Account created — please sign in to continue." };
    }
  }

  // Link the buyer to the transaction. Uses the service role because RLS only
  // lets the agent add participants. Idempotent on the unique constraint.
  const { error: participantError } = await admin
    .from("transaction_participants")
    .upsert(
      {
        transaction_id: view.transactionId,
        profile_id: profileId,
        role: view.role,
      },
      { onConflict: "transaction_id,profile_id", ignoreDuplicates: true }
    );

  if (participantError) {
    return { error: "Could not link you to the transaction. Please retry." };
  }

  // Mark the invitation accepted.
  await admin
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_profile_id: profileId,
    })
    .eq("id", view.invitationId);

  revalidatePath("/track");
  redirect("/track");
}
