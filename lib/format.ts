import type { Transaction } from "@/lib/types";

/** One-line street address. */
export function formatAddressLine(
  t: Pick<Transaction, "property_street" | "property_unit">
): string {
  return t.property_unit
    ? `${t.property_street}, ${t.property_unit}`
    : t.property_street;
}

/** "City, ST 12345" */
export function formatCityStateZip(
  t: Pick<
    Transaction,
    "property_city" | "property_state" | "property_postal_code"
  >
): string {
  return `${t.property_city}, ${t.property_state} ${t.property_postal_code}`;
}

/** Friendly date like "Sep 12, 2026", or a fallback when null. */
export function formatDate(
  value: string | null | undefined,
  fallback = "TBD"
): string {
  if (!value) return fallback;
  const d = new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
