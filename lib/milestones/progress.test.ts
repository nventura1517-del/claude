import { describe, it, expect } from "vitest";
import { computeProgress, milestoneStatus } from "./progress";

const m = (sequence: number, is_complete = false, needs_attention = false) => ({
  sequence,
  is_complete,
  needs_attention,
});

describe("computeProgress", () => {
  it("handles an empty list", () => {
    expect(computeProgress([])).toEqual({
      total: 0,
      completed: 0,
      percent: 0,
      currentSequence: null,
    });
  });

  it("reports the first incomplete milestone as the current stage", () => {
    const p = computeProgress([m(1, true), m(2, true), m(3), m(4)]);
    expect(p.completed).toBe(2);
    expect(p.total).toBe(4);
    expect(p.percent).toBe(50);
    expect(p.currentSequence).toBe(3);
  });

  it("rounds the percentage", () => {
    // 1 of 3 complete -> 33.33 -> 33
    expect(computeProgress([m(1, true), m(2), m(3)]).percent).toBe(33);
    // 2 of 3 complete -> 66.66 -> 67
    expect(computeProgress([m(1, true), m(2, true), m(3)]).percent).toBe(67);
  });

  it("returns 100% and no current stage when all complete", () => {
    const p = computeProgress([m(1, true), m(2, true)]);
    expect(p.percent).toBe(100);
    expect(p.currentSequence).toBeNull();
  });

  it("picks the lowest incomplete sequence regardless of input order", () => {
    const p = computeProgress([m(3), m(1, true), m(2)]);
    expect(p.currentSequence).toBe(2);
  });
});

describe("milestoneStatus", () => {
  it("marks completed milestones complete even if flagged", () => {
    expect(milestoneStatus(m(1, true, true), 1)).toBe("complete");
  });

  it("prioritizes attention over current for incomplete milestones", () => {
    expect(milestoneStatus(m(3, false, true), 3)).toBe("attention");
  });

  it("marks the current-stage milestone current", () => {
    expect(milestoneStatus(m(3), 3)).toBe("current");
  });

  it("marks other incomplete milestones upcoming", () => {
    expect(milestoneStatus(m(5), 3)).toBe("upcoming");
  });
});
