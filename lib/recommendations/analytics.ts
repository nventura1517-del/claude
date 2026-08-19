import type { RecommendationEventType } from "@/lib/types";
import { FUNNEL_STAGES } from "@/lib/recommendations/events";
import { categoryLabel } from "@/lib/professionals/categories";

/** Minimal recommendation shape the aggregation needs. */
export type RecForAnalytics = {
  professional_id: string;
  prof_name: string;
  prof_category: string;
  reached: RecommendationEventType[];
};

export type FunnelCount = { key: string; label: string; count: number };

export type CategoryStat = {
  category: string;
  label: string;
  total: number;
  contacted: number;
  booked: number;
};

export type ProfessionalStat = {
  professionalId: string;
  name: string;
  category: string;
  total: number;
  contacted: number;
  booked: number;
  completed: number;
};

export type ReferralAnalytics = {
  totalRecommendations: number;
  funnel: FunnelCount[];
  byCategory: CategoryStat[];
  byProfessional: ProfessionalStat[];
};

/**
 * The furthest funnel stage index a recommendation reached (0 = shown). A later
 * stage implies the earlier ones for counting, giving a monotonic funnel.
 */
export function furthestStageIndex(
  reached: readonly RecommendationEventType[]
): number {
  const set = new Set(reached);
  let furthest = 0;
  FUNNEL_STAGES.forEach((stage, i) => {
    if (stage.eventTypes.some((t) => set.has(t))) furthest = i;
  });
  return furthest;
}

const CONTACTED_INDEX = FUNNEL_STAGES.findIndex((s) => s.key === "contacted");
const BOOKED_INDEX = FUNNEL_STAGES.findIndex((s) => s.key === "booked");
const COMPLETED_INDEX = FUNNEL_STAGES.findIndex((s) => s.key === "completed");

/** Aggregate recommendations into overall funnel, per-category, per-pro stats. */
export function aggregateReferralAnalytics(
  recs: readonly RecForAnalytics[]
): ReferralAnalytics {
  const funnelCounts = FUNNEL_STAGES.map(() => 0);
  const categoryMap = new Map<string, CategoryStat>();
  const proMap = new Map<string, ProfessionalStat>();

  for (const rec of recs) {
    const furthest = furthestStageIndex(rec.reached);
    // Count toward every stage up to and including the furthest reached.
    for (let i = 0; i <= furthest; i++) funnelCounts[i] += 1;

    const contacted = furthest >= CONTACTED_INDEX ? 1 : 0;
    const booked = furthest >= BOOKED_INDEX ? 1 : 0;
    const completed = furthest >= COMPLETED_INDEX ? 1 : 0;

    const cat = categoryMap.get(rec.prof_category) ?? {
      category: rec.prof_category,
      label: categoryLabel(rec.prof_category),
      total: 0,
      contacted: 0,
      booked: 0,
    };
    cat.total += 1;
    cat.contacted += contacted;
    cat.booked += booked;
    categoryMap.set(rec.prof_category, cat);

    const pro = proMap.get(rec.professional_id) ?? {
      professionalId: rec.professional_id,
      name: rec.prof_name,
      category: rec.prof_category,
      total: 0,
      contacted: 0,
      booked: 0,
      completed: 0,
    };
    pro.total += 1;
    pro.contacted += contacted;
    pro.booked += booked;
    pro.completed += completed;
    proMap.set(rec.professional_id, pro);
  }

  return {
    totalRecommendations: recs.length,
    funnel: FUNNEL_STAGES.map((s, i) => ({
      key: s.key,
      label: s.label,
      count: funnelCounts[i],
    })),
    byCategory: Array.from(categoryMap.values()).sort(
      (a, b) => b.total - a.total
    ),
    byProfessional: Array.from(proMap.values()).sort(
      (a, b) => b.booked - a.booked || b.total - a.total
    ),
  };
}
