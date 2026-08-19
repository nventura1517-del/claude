"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { buildMilestoneRows } from "@/lib/milestones/apply";

export type CreateTransactionState = { error: string | null };

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createTransactionAction(
  _prev: CreateTransactionState,
  formData: FormData
): Promise<CreateTransactionState> {
  const agent = await requireRole(["agent"]);
  const supabase = await createClient();

  const street = str(formData, "property_street");
  const city = str(formData, "property_city");
  const state = str(formData, "property_state");
  const zip = str(formData, "property_postal_code");
  const unit = str(formData, "property_unit") || null;
  const buyerName = str(formData, "buyer_name") || null;
  const buyerEmail = str(formData, "buyer_email").toLowerCase() || null;
  const closing = str(formData, "estimated_closing_date") || null;

  if (!street || !city || !state || !zip) {
    return { error: "Please fill in the full property address." };
  }
  if (closing && Number.isNaN(new Date(closing + "T00:00:00").getTime())) {
    return { error: "That closing date doesn't look valid." };
  }

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      agent_id: agent.id,
      property_street: street,
      property_unit: unit,
      property_city: city,
      property_state: state,
      property_postal_code: zip,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      estimated_closing_date: closing,
    })
    .select("id")
    .single();

  if (txError || !tx) {
    return { error: "Could not create the transaction. Please try again." };
  }

  const transactionId = tx.id as string;

  // Add the agent as a participant so membership checks work uniformly.
  const { error: participantError } = await supabase
    .from("transaction_participants")
    .insert({
      transaction_id: transactionId,
      profile_id: agent.id,
      role: "agent",
    });

  // Generate the standard milestones.
  const { error: milestoneError } = await supabase
    .from("milestones")
    .insert(buildMilestoneRows(transactionId, closing));

  if (participantError || milestoneError) {
    // Roll back the transaction so we don't leave a half-built record.
    await supabase.from("transactions").delete().eq("id", transactionId);
    return { error: "Could not set up the transaction. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect(`/transactions/${transactionId}`);
}
