import { describe, it, expect } from "vitest";
import { buildMilestoneRows } from "./apply";
import { MILESTONE_TEMPLATE } from "./template";

describe("buildMilestoneRows", () => {
  it("creates one sequenced row per template milestone", () => {
    const rows = buildMilestoneRows("tx-1", null);
    expect(rows).toHaveLength(MILESTONE_TEMPLATE.length);
    expect(rows.map((r) => r.sequence)).toEqual(
      MILESTONE_TEMPLATE.map((_, i) => i + 1)
    );
    expect(rows.every((r) => r.transaction_id === "tx-1")).toBe(true);
  });

  it("leaves due dates null when no closing date is given", () => {
    const rows = buildMilestoneRows("tx-1", null);
    expect(rows.every((r) => r.due_date === null)).toBe(true);
  });

  it("derives due dates as dayOffset days before the closing date", () => {
    const rows = buildMilestoneRows("tx-1", "2026-10-01");
    // offer_accepted has dayOffset 40 -> Aug 22, 2026
    expect(rows[0].due_date).toBe("2026-08-22");
    // keys_received has dayOffset 0 -> the closing date itself
    expect(rows[rows.length - 1].due_date).toBe("2026-10-01");
  });
});
