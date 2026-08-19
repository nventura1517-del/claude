import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { ProgressBar } from "@/components/ProgressBar";
import { AgentMilestoneEditor } from "@/components/AgentMilestoneEditor";
import { InviteBuyerForm } from "@/components/InviteBuyerForm";
import { getTransactionDetail } from "@/lib/data/transactions";
import {
  formatAddressLine,
  formatCityStateZip,
  formatDate,
} from "@/lib/format";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["agent"]);
  const { id } = await params;
  const detail = await getTransactionDetail(id);

  // RLS returns nothing for transactions this agent doesn't own.
  if (!detail || detail.transaction.agent_id !== profile.id) notFound();

  const { transaction, progress, buyers } = detail;
  const buyerLabel =
    buyers.length > 0
      ? buyers.map((b) => b.full_name).join(", ")
      : (transaction.buyer_name ?? "Not invited yet");

  return (
    <AppShell role="agent" userName={profile.full_name}>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-muted hover:text-ink"
      >
        ← All transactions
      </Link>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {formatAddressLine(transaction)}
        </h1>
        <p className="text-muted">{formatCityStateZip(transaction)}</p>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Buyer</dt>
            <dd className="font-medium text-ink">{buyerLabel}</dd>
          </div>
          <div>
            <dt className="text-muted">Est. closing</dt>
            <dd className="font-medium text-ink">
              {formatDate(transaction.estimated_closing_date)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="font-medium capitalize text-ink">
              {transaction.status}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <ProgressBar
            percent={progress.percent}
            label={`${progress.completed} of ${progress.total} steps complete`}
          />
        </div>

        <div className="mt-5">
          <Link
            href={`/transactions/${transaction.id}/referrals`}
            className="inline-flex items-center rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Recommend professionals →
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Buyer access</h2>
        {buyers.length > 0 ? (
          <p className="mt-2 text-sm text-muted">
            <span className="font-medium text-ink">{buyerLabel}</span> has
            joined and can see their tracker.
          </p>
        ) : (
          <>
            <p className="mb-3 mt-2 text-sm text-muted">
              Invite your buyer by email. They&rsquo;ll get a link to set up
              their mobile progress tracker.
            </p>
            <InviteBuyerForm
              transactionId={transaction.id}
              defaultEmail={transaction.buyer_email}
            />
          </>
        )}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-ink">Milestones</h2>
      <AgentMilestoneEditor
        milestones={detail.milestones}
        transactionId={transaction.id}
        currentSequence={progress.currentSequence}
      />
    </AppShell>
  );
}
