import { describe, it, expect } from "vitest";
import {
  furthestStageIndex,
  aggregateReferralAnalytics,
  type RecForAnalytics,
} from "./analytics";

describe("furthestStageIndex", () => {
  it("returns 0 for shown only", () => {
    expect(furthestStageIndex(["shown"])).toBe(0);
  });
  it("treats any contact type as the contacted stage (index 2)", () => {
    expect(furthestStageIndex(["shown", "text_initiated"])).toBe(2);
  });
  it("returns the furthest even if intermediate stages weren't logged", () => {
    // booked without an explicit 'viewed' still counts as booked (index 3)
    expect(furthestStageIndex(["shown", "booked"])).toBe(3);
  });
});

describe("aggregateReferralAnalytics", () => {
  const recs: RecForAnalytics[] = [
    {
      professional_id: "p1",
      prof_name: "Inspector A",
      prof_category: "home_inspection",
      reached: ["shown", "viewed", "call_initiated", "booked"],
    },
    {
      professional_id: "p1",
      prof_name: "Inspector A",
      prof_category: "home_inspection",
      reached: ["shown", "viewed"],
    },
    {
      professional_id: "p2",
      prof_name: "Lender B",
      prof_category: "mortgage",
      reached: ["shown"],
    },
  ];

  it("builds a monotonically non-increasing funnel", () => {
    const a = aggregateReferralAnalytics(recs);
    const counts = a.funnel.map((f) => f.count);
    // shown=3, viewed=2, contacted=1, booked=1, completed=0
    expect(counts).toEqual([3, 2, 1, 1, 0]);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
    }
  });

  it("groups per professional with booked counts", () => {
    const a = aggregateReferralAnalytics(recs);
    const p1 = a.byProfessional.find((p) => p.professionalId === "p1")!;
    expect(p1.total).toBe(2);
    expect(p1.booked).toBe(1);
    expect(p1.completed).toBe(0);
  });

  it("groups per category", () => {
    const a = aggregateReferralAnalytics(recs);
    const inspection = a.byCategory.find(
      (c) => c.category === "home_inspection"
    )!;
    expect(inspection.total).toBe(2);
    expect(inspection.contacted).toBe(1);
  });

  it("handles no recommendations", () => {
    const a = aggregateReferralAnalytics([]);
    expect(a.totalRecommendations).toBe(0);
    expect(a.funnel.every((f) => f.count === 0)).toBe(true);
  });
});
