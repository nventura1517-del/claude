import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
