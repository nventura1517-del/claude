import type { RecommendationEventType } from "@/lib/types";

/**
 * Attribution funnel. Each stage is "reached" if a recommendation has at least
 * one event of that (or a later contact) type. Ordering is used for analytics.
 */
export const FUNNEL_STAGES: {
  key: "shown" | "viewed" | "contacted" | "booked" | "completed";
  label: string;
  eventTypes: RecommendationEventType[];
}[] = [
  { key: "shown", label: "Shown", eventTypes: ["shown"] },
  { key: "viewed", label: "Viewed", eventTypes: ["viewed"] },
  {
    key: "contacted",
    label: "Contacted",
    eventTypes: ["call_initiated", "text_initiated", "quote_requested"],
  },
  { key: "booked", label: "Booked", eventTypes: ["booked"] },
  { key: "completed", label: "Completed", eventTypes: ["completed"] },
];

/** Buyer-initiated contact actions surfaced on a recommendation card. */
export const CONTACT_ACTIONS: {
  event: RecommendationEventType;
  label: string;
}[] = [
  { event: "call_initiated", label: "Call" },
  { event: "text_initiated", label: "Text" },
  { event: "quote_requested", label: "Request a quote" },
];

export const ALL_EVENT_TYPES: RecommendationEventType[] = [
  "shown",
  "viewed",
  "call_initiated",
  "text_initiated",
  "quote_requested",
  "booked",
  "completed",
];

export function isEventType(v: string): v is RecommendationEventType {
  return (ALL_EVENT_TYPES as string[]).includes(v);
}
