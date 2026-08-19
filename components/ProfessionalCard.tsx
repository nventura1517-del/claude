import Link from "next/link";
import type { Professional } from "@/lib/types";
import { categoryLabel } from "@/lib/professionals/categories";

export function ProfessionalCard({
  professional,
}: {
  professional: Professional;
}) {
  const p = professional;
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
            {categoryLabel(p.category)}
          </span>
          <h3 className="mt-2 font-semibold text-ink">{p.name}</h3>
          {p.company && <p className="text-sm text-muted">{p.company}</p>}
        </div>
        <Link
          href={`/network/${p.id}`}
          className="shrink-0 text-sm font-medium text-brand hover:underline"
        >
          Edit
        </Link>
      </div>

      <dl className="mt-3 space-y-1 text-sm text-muted">
        {p.phone && <dd>{p.phone}</dd>}
        {p.email && <dd className="truncate">{p.email}</dd>}
        {p.website && <dd className="truncate">{p.website}</dd>}
      </dl>
    </div>
  );
}
