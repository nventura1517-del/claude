import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { TransactionCard } from "@/components/TransactionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAgentDashboard } from "@/lib/data/transactions";

export default async function DashboardPage() {
  const profile = await requireRole(["agent"]);
  const summaries = await getAgentDashboard(profile.id);

  return (
    <AppShell role="agent" userName={profile.full_name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-muted">
            {summaries.length} active{" "}
            {summaries.length === 1 ? "transaction" : "transactions"}
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          New transaction
        </Link>
      </div>

      {summaries.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Create your first transaction to generate the standard homebuying milestones and invite your client."
          actionHref="/transactions/new"
          actionLabel="Create a transaction"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {summaries.map((s) => (
            <TransactionCard key={s.transaction.id} summary={s} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
