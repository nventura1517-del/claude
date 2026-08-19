"use client";

import { useState } from "react";
import type { BuyerTransactionView } from "@/lib/data/transactions";
import type { Milestone } from "@/lib/types";
import {
  milestoneStatus,
  type MilestoneStatus,
} from "@/lib/milestones/progress";
import { ProgressBar } from "@/components/ProgressBar";
import {
  RecommendationCard,
  type BuyerRecommendation,
} from "@/components/buyer/RecommendationCard";
import {
  formatAddressLine,
  formatCityStateZip,
  formatDate,
} from "@/lib/format";

const DOT: Record<MilestoneStatus, string> = {
  complete: "bg-success text-white",
  current: "bg-brand text-white ring-4 ring-brand-soft",
  attention: "bg-attention text-white ring-4 ring-attention/15",
  upcoming: "bg-canvas text-muted border border-line",
};

function StepDot({
  status,
  index,
}: {
  status: MilestoneStatus;
  index: number;
}) {
  return (
    <span
      aria-hidden
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${DOT[status]}`}
    >
      {status === "complete" ? "✓" : index}
    </span>
  );
}

function isBuyerAction(m: Milestone, status: MilestoneStatus): boolean {
  if (m.is_complete) return false;
  if (status === "attention") return true;
  return status === "current" && m.responsible_party === "buyer";
}

export function BuyerTracker({
  view,
  recommendations = [],
}: {
  view: BuyerTransactionView;
  recommendations?: BuyerRecommendation[];
}) {
  const { transaction, milestones, progress, currentMilestone, lastCompleted } =
    view;
  const [openId, setOpenId] = useState<string | null>(
    currentMilestone?.id ?? null
  );

  const actionItems = milestones.filter((m) =>
    isBuyerAction(m, milestoneStatus(m, progress.currentSequence))
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* Hero */}
      <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <p className="text-sm text-muted">{formatAddressLine(transaction)}</p>
        <p className="text-xs text-muted">{formatCityStateZip(transaction)}</p>

        <p className="mt-4 text-sm font-medium text-brand">
          {progress.percent === 100 ? "All done" : "You're here"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {currentMilestone
            ? currentMilestone.name
            : "Your purchase is complete 🎉"}
        </h1>

        <div className="mt-5">
          <ProgressBar
            percent={progress.percent}
            label={`${progress.completed} of ${progress.total} steps`}
          />
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3 text-sm">
          <span className="text-muted">Estimated closing</span>
          <span className="font-semibold text-ink">
            {formatDate(transaction.estimated_closing_date)}
          </span>
        </div>

        {lastCompleted && progress.percent < 100 && (
          <p className="mt-3 text-sm text-muted">
            <span className="font-medium text-success">Just completed:</span>{" "}
            {lastCompleted.name}
          </p>
        )}
      </section>

      {/* Action items */}
      {actionItems.length > 0 && (
        <section className="mt-4 rounded-2xl border border-attention/30 bg-attention/5 p-5">
          <h2 className="text-sm font-semibold text-attention">
            Things that may need your attention
          </h2>
          <ul className="mt-2 space-y-2">
            {actionItems.map((m) => (
              <li key={m.id} className="text-sm text-ink">
                <span className="font-medium">{m.name}</span>
                <span className="block text-muted">{m.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Stepper */}
      <section className="mt-6">
        <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-muted">
          Every step
        </h2>
        <ol className="space-y-2">
          {milestones.map((m) => {
            const status = milestoneStatus(m, progress.currentSequence);
            const open = openId === m.id;
            return (
              <li
                key={m.id}
                className="overflow-hidden rounded-2xl border border-line bg-surface"
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : m.id)}
                  className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <StepDot status={status} index={m.sequence} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{m.name}</span>
                    <span className="block text-xs text-muted">
                      {status === "complete"
                        ? "Done"
                        : status === "current"
                          ? "Happening now"
                          : status === "attention"
                            ? "Needs attention"
                            : m.due_date
                              ? `Expected ${formatDate(m.due_date)}`
                              : "Upcoming"}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
                  >
                    ⌄
                  </span>
                </button>
                {open && (
                  <div className="border-t border-line px-4 pb-4 pt-3 text-sm text-muted">
                    {m.description}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Recommended professionals */}
      {recommendations.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-muted">
            Recommended by {view.agentName}
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </section>
      )}

      {/* Who can help */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Who can help</h2>
        <p className="mt-1 text-sm text-muted">
          {view.agentName} is your agent and can answer any questions.
          {view.agentPhone ? ` Call or text ${view.agentPhone}.` : ""}
        </p>
      </section>
    </div>
  );
}
