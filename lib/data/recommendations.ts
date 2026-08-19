import { createClient } from "@/lib/supabase/server";
import type {
  Recommendation,
  RecommendationEvent,
  RecommendationEventType,
} from "@/lib/types";

export type RecommendationWithEvents = Recommendation & {
  reached: Set<RecommendationEventType>;
};

function attachEvents(
  recs: Recommendation[],
  events: RecommendationEvent[]
): RecommendationWithEvents[] {
  const byRec = new Map<string, Set<RecommendationEventType>>();
  for (const e of events) {
    const set = byRec.get(e.recommendation_id) ?? new Set();
    set.add(e.event_type);
    byRec.set(e.recommendation_id, set);
  }
  return recs.map((r) => ({
    ...r,
    reached: byRec.get(r.id) ?? new Set<RecommendationEventType>(),
  }));
}

/**
 * Active recommendations for a transaction, each with the set of funnel event
 * types it has reached. RLS restricts this to transaction members (agent and
 * buyer alike).
 */
export async function getRecommendationsForTransaction(
  transactionId: string
): Promise<RecommendationWithEvents[]> {
  const supabase = await createClient();

  const { data: recs } = await supabase
    .from("recommendations")
    .select("*")
    .eq("transaction_id", transactionId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const recommendations = (recs as Recommendation[]) ?? [];
  if (recommendations.length === 0) return [];

  const { data: events } = await supabase
    .from("recommendation_events")
    .select("*")
    .in(
      "recommendation_id",
      recommendations.map((r) => r.id)
    );

  return attachEvents(recommendations, (events as RecommendationEvent[]) ?? []);
}

/**
 * Active recommendations for the buyer's tracker, in a serializable shape
 * (reached as an array, not a Set) safe to pass to Client Components.
 */
export async function getBuyerRecommendations(transactionId: string): Promise<
  {
    id: string;
    prof_name: string;
    prof_company: string | null;
    prof_category: string;
    prof_phone: string | null;
    prof_email: string | null;
    prof_website: string | null;
    reached: RecommendationEventType[];
  }[]
> {
  const recs = await getRecommendationsForTransaction(transactionId);
  return recs.map((r) => ({
    id: r.id,
    prof_name: r.prof_name,
    prof_company: r.prof_company,
    prof_category: r.prof_category,
    prof_phone: r.prof_phone,
    prof_email: r.prof_email,
    prof_website: r.prof_website,
    reached: Array.from(r.reached),
  }));
}

/** professional_ids already recommended on a transaction (to hide duplicates). */
export async function getRecommendedProfessionalIds(
  transactionId: string
): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recommendations")
    .select("professional_id")
    .eq("transaction_id", transactionId)
    .eq("status", "active");
  return new Set((data ?? []).map((r) => r.professional_id as string));
}
