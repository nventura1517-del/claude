/**
 * Fixed service categories for the referral network. Slugs are stored in the
 * database (and constrained there); labels are shown in the UI. Keep this list
 * in sync with the CHECK constraint in migration 0004.
 */
export const PROFESSIONAL_CATEGORIES = [
  { slug: "mortgage", label: "Mortgage" },
  { slug: "escrow_title", label: "Escrow / Title" },
  { slug: "home_inspection", label: "Home Inspection" },
  { slug: "home_insurance", label: "Home Insurance" },
  { slug: "home_warranty", label: "Home Warranty" },
  { slug: "moving", label: "Moving" },
  { slug: "cleaning", label: "Cleaning" },
  { slug: "plumbing", label: "Plumbing" },
  { slug: "electrical", label: "Electrical" },
  { slug: "hvac", label: "HVAC" },
  { slug: "general_contractor", label: "General Contractor" },
  { slug: "roofing", label: "Roofing" },
  { slug: "landscaping", label: "Landscaping" },
  { slug: "pool_service", label: "Pool Service" },
  { slug: "handyman", label: "Handyman" },
] as const;

export type CategorySlug = (typeof PROFESSIONAL_CATEGORIES)[number]["slug"];

const LABELS: Record<string, string> = Object.fromEntries(
  PROFESSIONAL_CATEGORIES.map((c) => [c.slug, c.label])
);

export function categoryLabel(slug: string): string {
  return LABELS[slug] ?? slug;
}

export function isValidCategory(slug: string): slug is CategorySlug {
  return slug in LABELS;
}
