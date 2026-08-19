import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { RecommendFunnelBadge } from "@/components/RecommendFunnelBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTransactionDetail } from "@/lib/data/transactions";
import { getProfessionals } from "@/lib/data/professionals";
import {
  getRecommendationsForTransaction,
  getRecommendedProfessionalIds,
} from "@/lib/data/recommendations";
import {
  createRecommendationAction,
  dismissRecommendationAction,
} from "@/app/recommendations/actions";
import { categoryLabel } from "@/lib/professionals/categories";
import { formatAddressLine } from "@/lib/format";

export default async function ReferralsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["agent"]);
  const { id } = await params;

  const detail = await getTransactionDetail(id);
  if (!detail || detail.transaction.agent_id !== profile.id) notFound();

  const [professionals, recommendedIds, recommendations] = await Promise.all([
    getProfessionals(),
    getRecommendedProfessionalIds(id),
    getRecommendationsForTransaction(id),
  ]);

  const available = professionals.filter(
    (p) => p.is_active && !recommendedIds.has(p.id)
  );

  return (
    <AppShell role="agent" userName={profile.full_name}>
      <Link
        href={`/transactions/${id}`}
        className="text-sm font-medium text-muted hover:text-ink"
      >
        ← {formatAddressLine(detail.transaction)}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        Recommend professionals
      </h1>

      {/* Current recommendations */}
      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-muted">
        Recommended to this buyer
      </h2>
      {recommendations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-5 text-sm text-muted">
          Nothing recommended yet. Pick from your network below.
        </p>
      ) : (
        <ul className="space-y-2">
          {recommendations.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{r.prof_name}</p>
                <p className="text-xs text-muted">
                  {categoryLabel(r.prof_category)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RecommendFunnelBadge reached={r.reached} />
                <form action={dismissRecommendationAction}>
                  <input type="hidden" name="recommendation_id" value={r.id} />
                  <input type="hidden" name="transaction_id" value={id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-muted hover:text-danger"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Available professionals */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        From your network
      </h2>
      {professionals.length === 0 ? (
        <EmptyState
          title="Your network is empty"
          description="Add professionals to your network first, then recommend them here."
          actionHref="/network/new"
          actionLabel="Add a professional"
        />
      ) : available.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-5 text-sm text-muted">
          Everyone in your network is already recommended here.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {available.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{p.name}</p>
                <p className="text-xs text-muted">
                  {categoryLabel(p.category)}
                  {p.company ? ` · ${p.company}` : ""}
                </p>
              </div>
              <form action={createRecommendationAction}>
                <input type="hidden" name="transaction_id" value={id} />
                <input type="hidden" name="professional_id" value={p.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Recommend
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
