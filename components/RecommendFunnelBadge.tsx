import type { RecommendationEventType } from "@/lib/types";
import { FUNNEL_STAGES } from "@/lib/recommendations/events";

/** Furthest funnel stage a recommendation has reached, as a small label. */
export function RecommendFunnelBadge({
  reached,
}: {
  reached: Set<RecommendationEventType>;
}) {
  let furthest = FUNNEL_STAGES[0];
  for (const stage of FUNNEL_STAGES) {
    if (stage.eventTypes.some((t) => reached.has(t))) furthest = stage;
  }
  const isDone = furthest.key === "completed";
  const isBooked = furthest.key === "booked" || isDone;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isDone
          ? "bg-success/10 text-success"
          : isBooked
            ? "bg-brand-soft text-brand"
            : "bg-canvas text-muted"
      }`}
    >
      {furthest.label}
    </span>
  );
}
