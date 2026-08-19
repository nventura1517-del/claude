import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getReferralAnalytics } from "@/lib/data/analytics";

function pct(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AnalyticsPage() {
  const profile = await requireRole(["agent"]);
  const a = await getReferralAnalytics();

  if (a.totalRecommendations === 0) {
    return (
      <AppShell role="agent" userName={profile.full_name}>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">
          Referral analytics
        </h1>
        <EmptyState
          title="No referral activity yet"
          description="Once you recommend professionals to your buyers and they engage, you'll see the funnel here."
          actionHref="/network"
          actionLabel="Manage your network"
        />
      </AppShell>
    );
  }

  const max = a.funnel[0]?.count || 1;

  return (
    <AppShell role="agent" userName={profile.full_name}>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Referral analytics
      </h1>
      <p className="mt-1 text-sm text-muted">
        {a.totalRecommendations} recommendation
        {a.totalRecommendations === 1 ? "" : "s"} across your transactions.
      </p>

      {/* Funnel */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Funnel
        </h2>
        <div className="mt-4 space-y-3">
          {a.funnel.map((stage) => (
            <div key={stage.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink">{stage.label}</span>
                <span className="text-muted">
                  {stage.count} · {pct(stage.count, max)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: pct(stage.count, max) }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Per professional */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          By professional
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase text-muted">
                <th className="px-4 py-3 font-semibold">Professional</th>
                <th className="px-4 py-3 font-semibold">Recs</th>
                <th className="px-4 py-3 font-semibold">Contacted</th>
                <th className="px-4 py-3 font-semibold">Booked</th>
                <th className="px-4 py-3 font-semibold">Completed</th>
              </tr>
            </thead>
            <tbody>
              {a.byProfessional.map((p) => (
                <tr
                  key={p.professionalId}
                  className="border-b border-line last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.total}</td>
                  <td className="px-4 py-3 text-muted">{p.contacted}</td>
                  <td className="px-4 py-3 text-muted">{p.booked}</td>
                  <td className="px-4 py-3 text-muted">{p.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
