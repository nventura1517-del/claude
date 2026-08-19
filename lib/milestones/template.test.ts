import { describe, it, expect } from "vitest";
import { MILESTONE_TEMPLATE } from "./template";

describe("MILESTONE_TEMPLATE", () => {
  it("has the 13 standard milestones", () => {
    expect(MILESTONE_TEMPLATE).toHaveLength(13);
  });

  it("has unique keys", () => {
    const keys = MILESTONE_TEMPLATE.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("starts with offer accepted and ends with keys received", () => {
    expect(MILESTONE_TEMPLATE[0].key).toBe("offer_accepted");
    expect(MILESTONE_TEMPLATE[MILESTONE_TEMPLATE.length - 1].key).toBe(
      "keys_received"
    );
  });

  it("has a non-empty plain-language description for every milestone", () => {
    for (const t of MILESTONE_TEMPLATE) {
      expect(t.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("has non-increasing day offsets toward closing", () => {
    for (let i = 1; i < MILESTONE_TEMPLATE.length; i++) {
      expect(MILESTONE_TEMPLATE[i].dayOffset).toBeLessThanOrEqual(
        MILESTONE_TEMPLATE[i - 1].dayOffset
      );
    }
  });
});
