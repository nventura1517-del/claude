"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { computeProgress } from "@/lib/milestones/progress";
import { sendEmail } from "@/lib/email/send";
import { milestoneCompleteEmail } from "@/lib/email/templates";
import { formatAddressLine } from "@/lib/format";
import { APP_URL } from "@/lib/constants";
import type { Milestone, Transaction } from "@/lib/types";

type Op = "complete" | "reopen" | "flag" | "unflag" | "due_date";

/**
 * Agent-only milestone mutation. RLS (milestones_update_agent) is the real
 * guard; we also confirm ownership before side effects like email.
 */
export async function updateMilestoneAction(formData: FormData): Promise<void> {
  await requireRole(["agent"]);
  const supabase = await createClient();

  const op = String(formData.get("op") ?? "") as Op;
  const milestoneId = String(formData.get("milestone_id") ?? "");
  const transactionId = String(formData.get("transaction_id") ?? "");
  if (!milestoneId || !transactionId) return;

  let patch: Partial<Milestone> = {};
  switch (op) {
    case "complete":
      patch = {
        is_complete: true,
        completed_at: new Date().toISOString(),
        needs_attention: false,
      };
      break;
    case "reopen":
      patch = { is_complete: false, completed_at: null };
      break;
    case "flag":
      patch = { needs_attention: true };
      break;
    case "unflag":
      patch = { needs_attention: false };
      break;
    case "due_date": {
      const value = String(formData.get("due_date") ?? "").trim();
      patch = { due_date: value || null };
      break;
    }
    default:
      return;
  }

  const { error } = await supabase
    .from("milestones")
    .update(patch)
    .eq("id", milestoneId);

  if (!error && op === "complete") {
    await notifyBuyerOfCompletion(transactionId, milestoneId);
  }

  revalidatePath(`/transactions/${transactionId}`);
  revalidatePath("/track", "layout");
  revalidatePath(`/track/${transactionId}`);
}

/**
 * Best-effort buyer email when a milestone is completed. Never throws into the
 * mutation — a failed email must not break marking a milestone done.
 */
async function notifyBuyerOfCompletion(
  transactionId: string,
  milestoneId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    const { data: tx } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .maybeSingle();
    if (!tx) return;
    const transaction = tx as Transaction;
    if (!transaction.buyer_email) return;

    // Only notify once the buyer has actually joined.
    const { count } = await supabase
      .from("transaction_participants")
      .select("id", { count: "exact", head: true })
      .eq("transaction_id", transactionId)
      .in("role", ["buyer", "co_buyer"]);
    if (!count) return;

    const { data: rows } = await supabase
      .from("milestones")
      .select("*")
      .eq("transaction_id", transactionId)
      .order("sequence", { ascending: true });
    const milestones = (rows as Milestone[]) ?? [];

    const completed = milestones.find((m) => m.id === milestoneId);
    if (!completed) return;

    const progress = computeProgress(milestones);
    const next =
      progress.currentSequence === null
        ? null
        : (milestones.find((m) => m.sequence === progress.currentSequence) ??
          null);

    const { subject, html, text } = milestoneCompleteEmail({
      milestoneName: completed.name,
      propertyLabel: formatAddressLine(transaction),
      nextMilestoneName: next?.name ?? null,
      trackUrl: `${APP_URL}/track/${transactionId}`,
    });
    await sendEmail({ to: transaction.buyer_email, subject, html, text });
  } catch (err) {
    console.error("[milestone] completion email failed:", err);
  }
}
