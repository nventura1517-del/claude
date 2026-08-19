import type { Milestone } from "@/lib/types";
import { milestoneStatus } from "@/lib/milestones/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";

export function AgentMilestoneList({
  milestones,
  currentSequence,
}: {
  milestones: Milestone[];
  currentSequence: number | null;
}) {
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {milestones.map((m) => {
        const status = milestoneStatus(m, currentSequence);
        return (
          <li
            key={m.id}
            className="flex items-start justify-between gap-4 p-4 sm:p-5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">
                  {m.sequence}
                </span>
                <h3 className="font-medium text-ink">{m.name}</h3>
              </div>
              <p className="mt-1 text-sm text-muted">{m.description}</p>
              <p className="mt-1.5 text-xs text-muted">
                {m.responsible_party && (
                  <span className="capitalize">{m.responsible_party}</span>
                )}
                {m.due_date && <> · Due {formatDate(m.due_date)}</>}
                {m.is_complete && m.completed_at && (
                  <> · Completed {formatDate(m.completed_at.slice(0, 10))}</>
                )}
              </p>
            </div>
            <StatusBadge status={status} />
          </li>
        );
      })}
    </ol>
  );
}
