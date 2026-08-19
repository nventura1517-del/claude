"use client";

import { useFormStatus } from "react-dom";
import type { Milestone } from "@/lib/types";
import { milestoneStatus } from "@/lib/milestones/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { updateMilestoneAction } from "@/app/transactions/milestone-actions";
import { formatDate } from "@/lib/format";

function PendingButton({
  children,
  variant = "ghost",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const { pending } = useFormStatus();
  const base =
    "rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  const styles =
    variant === "primary"
      ? "bg-brand text-white hover:bg-brand-dark"
      : "border border-line text-ink hover:bg-canvas";
  return (
    <button type="submit" disabled={pending} className={`${base} ${styles}`}>
      {pending ? "…" : children}
    </button>
  );
}

function HiddenFields({
  milestoneId,
  transactionId,
  op,
}: {
  milestoneId: string;
  transactionId: string;
  op: string;
}) {
  return (
    <>
      <input type="hidden" name="milestone_id" value={milestoneId} />
      <input type="hidden" name="transaction_id" value={transactionId} />
      <input type="hidden" name="op" value={op} />
    </>
  );
}

export function AgentMilestoneEditor({
  milestones,
  transactionId,
  currentSequence,
}: {
  milestones: Milestone[];
  transactionId: string;
  currentSequence: number | null;
}) {
  return (
    <ol className="space-y-2">
      {milestones.map((m) => {
        const status = milestoneStatus(m, currentSequence);
        return (
          <li
            key={m.id}
            className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">
                    {m.sequence}
                  </span>
                  <h3 className="font-medium text-ink">{m.name}</h3>
                </div>
                <p className="mt-1 text-sm text-muted">{m.description}</p>
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {m.is_complete ? (
                <form action={updateMilestoneAction}>
                  <HiddenFields
                    milestoneId={m.id}
                    transactionId={transactionId}
                    op="reopen"
                  />
                  <PendingButton>Reopen</PendingButton>
                </form>
              ) : (
                <form action={updateMilestoneAction}>
                  <HiddenFields
                    milestoneId={m.id}
                    transactionId={transactionId}
                    op="complete"
                  />
                  <PendingButton variant="primary">Mark complete</PendingButton>
                </form>
              )}

              {!m.is_complete && (
                <form action={updateMilestoneAction}>
                  <HiddenFields
                    milestoneId={m.id}
                    transactionId={transactionId}
                    op={m.needs_attention ? "unflag" : "flag"}
                  />
                  <PendingButton>
                    {m.needs_attention ? "Clear attention" : "Flag attention"}
                  </PendingButton>
                </form>
              )}

              <form
                action={updateMilestoneAction}
                className="flex items-center gap-2"
              >
                <HiddenFields
                  milestoneId={m.id}
                  transactionId={transactionId}
                  op="due_date"
                />
                <label className="text-xs text-muted">
                  Due
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={m.due_date ?? ""}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="ml-2 rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink focus:border-brand focus:outline-none"
                  />
                </label>
              </form>

              {m.is_complete && m.completed_at && (
                <span className="text-xs text-success">
                  Completed {formatDate(m.completed_at.slice(0, 10))}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
