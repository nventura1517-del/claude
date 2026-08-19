"use client";

import { useEffect, useRef, useState } from "react";
import type { RecommendationEventType } from "@/lib/types";
import { categoryLabel } from "@/lib/professionals/categories";
import { logRecommendationEvent } from "@/app/recommendations/actions";

export type BuyerRecommendation = {
  id: string;
  prof_name: string;
  prof_company: string | null;
  prof_category: string;
  prof_phone: string | null;
  prof_email: string | null;
  prof_website: string | null;
  reached: RecommendationEventType[];
};

export function RecommendationCard({ rec }: { rec: BuyerRecommendation }) {
  const [reached, setReached] = useState<Set<RecommendationEventType>>(
    new Set(rec.reached)
  );
  const viewedLogged = useRef(false);

  // Log a single 'viewed' when the buyer first sees this card.
  useEffect(() => {
    if (viewedLogged.current || reached.has("viewed")) return;
    viewedLogged.current = true;
    void logRecommendationEvent(rec.id, "viewed");
    setReached((prev) => new Set(prev).add("viewed"));
  }, [rec.id, reached]);

  function log(event: RecommendationEventType, href?: string) {
    void logRecommendationEvent(rec.id, event);
    setReached((prev) => new Set(prev).add(event));
    if (href && typeof window !== "undefined") window.location.href = href;
  }

  const booked = reached.has("booked") || reached.has("completed");

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
            {categoryLabel(rec.prof_category)}
          </span>
          <p className="mt-1.5 font-semibold text-ink">{rec.prof_name}</p>
          {rec.prof_company && (
            <p className="text-sm text-muted">{rec.prof_company}</p>
          )}
        </div>
        {booked && (
          <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
            {reached.has("completed") ? "Completed" : "Booked"}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {rec.prof_phone && (
          <button
            type="button"
            onClick={() => log("call_initiated", `tel:${rec.prof_phone}`)}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Call
          </button>
        )}
        {rec.prof_phone && (
          <button
            type="button"
            onClick={() => log("text_initiated", `sms:${rec.prof_phone}`)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Text
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            log(
              "quote_requested",
              rec.prof_email ? `mailto:${rec.prof_email}` : undefined
            )
          }
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Request a quote
        </button>
      </div>

      {!booked && (
        <button
          type="button"
          onClick={() => log("booked")}
          className="mt-3 text-sm font-medium text-brand hover:underline"
        >
          Mark as booked
        </button>
      )}
    </div>
  );
}
