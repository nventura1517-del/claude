import type { MilestoneStatus } from "@/lib/milestones/progress";

const STYLES: Record<MilestoneStatus, { label: string; className: string }> = {
  complete: {
    label: "Done",
    className: "bg-success/10 text-success",
  },
  current: {
    label: "In progress",
    className: "bg-brand-soft text-brand",
  },
  attention: {
    label: "Needs attention",
    className: "bg-attention/10 text-attention",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-canvas text-muted",
  },
};

export function StatusBadge({ status }: { status: MilestoneStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
}
