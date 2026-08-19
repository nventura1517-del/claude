import { createClient } from "@/lib/supabase/server";
import type { Milestone, Profile, Transaction } from "@/lib/types";
import {
  computeProgress,
  type TransactionProgress,
} from "@/lib/milestones/progress";

export type TransactionSummary = {
  transaction: Transaction;
  milestones: Milestone[];
  progress: TransactionProgress;
  currentMilestone: Milestone | null;
  attentionCount: number;
  buyers: Pick<Profile, "id" | "full_name">[];
};

/** Milestones for a transaction, ordered by sequence. RLS restricts rows. */
export async function getMilestones(
  transactionId: string
): Promise<Milestone[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("milestones")
    .select("*")
    .eq("transaction_id", transactionId)
    .order("sequence", { ascending: true });
  return (data as Milestone[]) ?? [];
}

function summarize(
  transaction: Transaction,
  milestones: Milestone[],
  buyers: Pick<Profile, "id" | "full_name">[]
): TransactionSummary {
  const progress = computeProgress(milestones);
  const currentMilestone =
    progress.currentSequence === null
      ? null
      : (milestones.find((m) => m.sequence === progress.currentSequence) ??
        null);
  const attentionCount = milestones.filter(
    (m) => m.needs_attention && !m.is_complete
  ).length;
  return {
    transaction,
    milestones,
    progress,
    currentMilestone,
    attentionCount,
    buyers,
  };
}

/**
 * Summaries of every transaction the current agent owns, for the dashboard.
 * RLS ensures only the agent's own transactions are returned.
 */
export async function getAgentDashboard(
  agentId: string
): Promise<TransactionSummary[]> {
  const supabase = await createClient();

  const { data: txs } = await supabase
    .from("transactions")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  const transactions = (txs as Transaction[]) ?? [];
  if (transactions.length === 0) return [];

  const ids = transactions.map((t) => t.id);

  const { data: allMilestones } = await supabase
    .from("milestones")
    .select("*")
    .in("transaction_id", ids)
    .order("sequence", { ascending: true });

  const { data: participantRows } = await supabase
    .from("transaction_participants")
    .select("transaction_id, role, profiles(id, full_name)")
    .in("transaction_id", ids)
    .in("role", ["buyer", "co_buyer"]);

  const milestonesByTx = new Map<string, Milestone[]>();
  for (const m of (allMilestones as Milestone[]) ?? []) {
    const list = milestonesByTx.get(m.transaction_id) ?? [];
    list.push(m);
    milestonesByTx.set(m.transaction_id, list);
  }

  const buyersByTx = new Map<string, Pick<Profile, "id" | "full_name">[]>();
  type ParticipantJoinRow = {
    transaction_id: string;
    profiles: Pick<Profile, "id" | "full_name"> | null;
  };
  for (const row of (participantRows as ParticipantJoinRow[] | null) ?? []) {
    if (!row.profiles) continue;
    const list = buyersByTx.get(row.transaction_id) ?? [];
    list.push(row.profiles);
    buyersByTx.set(row.transaction_id, list);
  }

  return transactions.map((t) =>
    summarize(t, milestonesByTx.get(t.id) ?? [], buyersByTx.get(t.id) ?? [])
  );
}

/** A single transaction with its milestones and buyers, or null if no access. */
export async function getTransactionDetail(
  transactionId: string
): Promise<TransactionSummary | null> {
  const supabase = await createClient();

  const { data: tx } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .maybeSingle();

  if (!tx) return null;

  const milestones = await getMilestones(transactionId);

  const { data: participantRows } = await supabase
    .from("transaction_participants")
    .select("role, profiles(id, full_name)")
    .eq("transaction_id", transactionId)
    .in("role", ["buyer", "co_buyer"]);

  type ParticipantJoinRow = {
    profiles: Pick<Profile, "id" | "full_name"> | null;
  };
  const buyers = ((participantRows as ParticipantJoinRow[] | null) ?? [])
    .map((r) => r.profiles)
    .filter((p): p is Pick<Profile, "id" | "full_name"> => p !== null);

  return summarize(tx as Transaction, milestones, buyers);
}
