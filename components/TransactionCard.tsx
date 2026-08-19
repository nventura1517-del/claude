import Link from "next/link";
import type { TransactionSummary } from "@/lib/data/transactions";
import { ProgressBar } from "@/components/ProgressBar";
import {
  formatAddressLine,
  formatCityStateZip,
  formatDate,
} from "@/lib/format";

export function TransactionCard({ summary }: { summary: TransactionSummary }) {
  const { transaction, progress, currentMilestone, attentionCount, buyers } =
    summary;

  const buyerLabel =
    buyers.length > 0
      ? buyers.map((b) => b.full_name).join(", ")
      : (transaction.buyer_name ?? "Buyer not invited yet");

  return (
    <Link
      href={`/transactions/${transaction.id}`}
      className="block rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-brand/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">
            {formatAddressLine(transaction)}
          </h2>
          <p className="text-sm text-muted">
            {formatCityStateZip(transaction)}
          </p>
        </div>
        {attentionCount > 0 && (
          <span className="shrink-0 rounded-full bg-attention/10 px-2.5 py-0.5 text-xs font-semibold text-attention">
            {attentionCount} to review
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-muted">
        <span className="font-medium text-ink">{buyerLabel}</span>
      </p>

      <div className="mt-4">
        <ProgressBar percent={progress.percent} label="Progress" />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted">
          {currentMilestone ? (
            <>
              Current: <span className="text-ink">{currentMilestone.name}</span>
            </>
          ) : progress.total > 0 ? (
            <span className="font-medium text-success">All steps complete</span>
          ) : (
            "No milestones"
          )}
        </span>
        <span className="text-muted">
          Close {formatDate(transaction.estimated_closing_date)}
        </span>
      </div>
    </Link>
  );
}
