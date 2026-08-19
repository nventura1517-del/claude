import { createClient } from "@/lib/supabase/server";
import type { Recommendation, RecommendationEvent } from "@/lib/types";
import {
  aggregateReferralAnalytics,
  type ReferralAnalytics,
  type RecForAnalytics,
} from "@/lib/recommendations/analytics";

/**
 * Referral analytics for the current agent. RLS scopes recommendations and
 * events to transactions the agent is a member of (i.e. their own), so a plain
 * select returns exactly their referral activity.
 */
export async function getReferralAnalytics(): Promise<ReferralAnalytics> {
  const supabase = await createClient();

  const { data: recs } = await supabase
    .from("recommendations")
    .select("*")
    .eq("status", "active");

  const recommendations = (recs as Recommendation[]) ?? [];
  if (recommendations.length === 0) return aggregateReferralAnalytics([]);

  const { data: events } = await supabase
    .from("recommendation_events")
    .select("recommendation_id, event_type")
    .in(
      "recommendation_id",
      recommendations.map((r) => r.id)
    );

  const reachedByRec = new Map<string, RecommendationEvent["event_type"][]>();
  for (const e of (events as Pick<
    RecommendationEvent,
    "recommendation_id" | "event_type"
  >[]) ?? []) {
    const list = reachedByRec.get(e.recommendation_id) ?? [];
    list.push(e.event_type);
    reachedByRec.set(e.recommendation_id, list);
  }

  const forAnalytics: RecForAnalytics[] = recommendations.map((r) => ({
    professional_id: r.professional_id,
    prof_name: r.prof_name,
    prof_category: r.prof_category,
    reached: reachedByRec.get(r.id) ?? [],
  }));

  return aggregateReferralAnalytics(forAnalytics);
}
