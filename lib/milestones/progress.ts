/**
 * Single source of truth for transaction progress and milestone display state.
 * See CLAUDE.md §8. Do not reimplement this logic elsewhere.
 */

export type MilestoneStatus = "upcoming" | "current" | "complete" | "attention";

/** The minimal milestone shape the progress logic needs. */
export type MilestoneLike = {
  sequence: number;
  is_complete: boolean;
  needs_attention: boolean;
};

export type TransactionProgress = {
  total: number;
  completed: number;
  /** 0–100, rounded, equal weight per milestone. */
  percent: number;
  /** sequence of the current stage, or null if none/all complete. */
  currentSequence: number | null;
};

/**
 * Compute overall progress. `currentSequence` is the lowest-sequence incomplete
 * milestone (the stage the buyer is "at"), or null when there are no
 * milestones or all are complete.
 */
export function computeProgress(
  milestones: readonly MilestoneLike[]
): TransactionProgress {
  const total = milestones.length;
  const completed = milestones.filter((m) => m.is_complete).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const currentSequence = milestones
    .filter((m) => !m.is_complete)
    .reduce<number | null>(
      (min, m) => (min === null || m.sequence < min ? m.sequence : min),
      null
    );

  return { total, completed, percent, currentSequence };
}

/**
 * Derive the display status of a single milestone given the transaction's
 * current stage. Precedence: complete → attention → current → upcoming.
 */
export function milestoneStatus(
  milestone: MilestoneLike,
  currentSequence: number | null
): MilestoneStatus {
  if (milestone.is_complete) return "complete";
  if (milestone.needs_attention) return "attention";
  if (currentSequence !== null && milestone.sequence === currentSequence) {
    return "current";
  }
  return "upcoming";
}
