"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireRole } from "@/lib/auth";
import { isEventType } from "@/lib/recommendations/events";
import type { RecommendationEventType } from "@/lib/types";

/** Agent recommends one of their professionals to a transaction. */
export async function createRecommendationAction(
  formData: FormData
): Promise<void> {
  const agent = await requireRole(["agent"]);
  const supabase = await createClient();

  const transactionId = String(formData.get("transaction_id") ?? "");
  const professionalId = String(formData.get("professional_id") ?? "");
  if (!transactionId || !professionalId) return;

  // RLS ensures the agent owns this professional.
  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", professionalId)
    .maybeSingle();
  if (!pro) return;

  // Snapshot the professional so the buyer can see contact details and the
  // record is stable. RLS ensures the agent owns the transaction.
  const { data: rec, error } = await supabase
    .from("recommendations")
    .insert({
      transaction_id: transactionId,
      professional_id: professionalId,
      created_by: agent.id,
      prof_name: pro.name,
      prof_company: pro.company,
      prof_category: pro.category,
      prof_phone: pro.phone,
      prof_email: pro.email,
      prof_website: pro.website,
    })
    .select("id")
    .single();

  if (error || !rec) return;

  // The recommendation is now surfaced to the buyer: log 'shown'.
  await supabase.from("recommendation_events").insert({
    recommendation_id: rec.id,
    event_type: "shown",
    actor_profile_id: agent.id,
  });

  revalidatePath(`/transactions/${transactionId}/referrals`);
  revalidatePath(`/track/${transactionId}`);
  revalidatePath("/track", "layout");
}

/** Agent removes a recommendation (soft dismiss). */
export async function dismissRecommendationAction(
  formData: FormData
): Promise<void> {
  await requireRole(["agent"]);
  const supabase = await createClient();

  const id = String(formData.get("recommendation_id") ?? "");
  const transactionId = String(formData.get("transaction_id") ?? "");
  if (!id) return;

  await supabase
    .from("recommendations")
    .update({ status: "dismissed" })
    .eq("id", id);

  revalidatePath(`/transactions/${transactionId}/referrals`);
  revalidatePath(`/track/${transactionId}`);
}

/**
 * Log a funnel event on a recommendation. Any transaction member may call it
 * (buyers log their own view/contact/booking activity); RLS enforces
 * membership. Returns nothing and is safe to call from the client.
 */
export async function logRecommendationEvent(
  recommendationId: string,
  eventType: string
): Promise<void> {
  const profile = await requireProfile();
  if (!recommendationId || !isEventType(eventType)) return;

  const supabase = await createClient();
  await supabase.from("recommendation_events").insert({
    recommendation_id: recommendationId,
    event_type: eventType as RecommendationEventType,
    actor_profile_id: profile.id,
  });

  // Refresh both the buyer tracker and the agent referral view.
  revalidatePath("/track", "layout");
}
