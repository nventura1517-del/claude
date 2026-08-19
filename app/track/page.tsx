import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BuyerTracker } from "@/components/buyer/BuyerTracker";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBuyerTransactions } from "@/lib/data/transactions";
import { formatAddressLine, formatDate } from "@/lib/format";

export default async function TrackPage() {
  const profile = await requireRole(["buyer"]);
  const views = await getBuyerTransactions();

  return (
    <AppShell role="buyer" userName={profile.full_name}>
      {views.length === 0 ? (
        <EmptyState
          title="No purchase yet"
          description="Once your agent sets up your transaction, your progress tracker will appear here."
        />
      ) : views.length === 1 ? (
        <BuyerTracker view={views[0]} />
      ) : (
        <div className="mx-auto max-w-xl space-y-3">
          <h1 className="text-xl font-semibold text-ink">Your purchases</h1>
          {views.map((v) => (
            <Link
              key={v.transaction.id}
              href={`/track/${v.transaction.id}`}
              className="block rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-brand/40"
            >
              <p className="font-medium text-ink">
                {formatAddressLine(v.transaction)}
              </p>
              <p className="text-sm text-muted">
                {v.progress.percent}% · closing{" "}
                {formatDate(v.transaction.estimated_closing_date)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
