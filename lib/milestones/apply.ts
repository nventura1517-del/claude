import { MILESTONE_TEMPLATE } from "./template";

/** A milestone row ready to insert for a newly created transaction. */
export type NewMilestoneRow = {
  transaction_id: string;
  template_key: string;
  name: string;
  description: string;
  sequence: number;
  responsible_party: string;
  due_date: string | null;
};

/** Format a Date as an ISO date (YYYY-MM-DD) with no time component. */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Build the milestone rows for a new transaction from the standard template.
 * If an estimated closing date is provided, each milestone's due date is
 * pre-filled from its `dayOffset` (days before closing); the agent can edit it.
 */
export function buildMilestoneRows(
  transactionId: string,
  estimatedClosingDate: string | null
): NewMilestoneRow[] {
  const closing = estimatedClosingDate
    ? new Date(estimatedClosingDate + "T00:00:00")
    : null;

  return MILESTONE_TEMPLATE.map((t, index) => {
    let dueDate: string | null = null;
    if (closing && !Number.isNaN(closing.getTime())) {
      const due = new Date(closing);
      due.setDate(due.getDate() - t.dayOffset);
      dueDate = toISODate(due);
    }

    return {
      transaction_id: transactionId,
      template_key: t.key,
      name: t.name,
      description: t.description,
      sequence: index + 1,
      responsible_party: t.responsibleParty,
      due_date: dueDate,
    };
  });
}
