import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { ProfessionalCard } from "@/components/ProfessionalCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProfessionals } from "@/lib/data/professionals";

export default async function NetworkPage() {
  const profile = await requireRole(["agent"]);
  const professionals = await getProfessionals();

  return (
    <AppShell role="agent" userName={profile.full_name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Your network
          </h1>
          <p className="mt-1 text-sm text-muted">
            Trusted professionals you can recommend to your clients.
          </p>
        </div>
        <Link
          href="/network/new"
          className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Add professional
        </Link>
      </div>

      {professionals.length === 0 ? (
        <EmptyState
          title="No professionals yet"
          description="Add the inspectors, lenders, movers, and trades you trust so you can recommend them to buyers at the right moment."
          actionHref="/network/new"
          actionLabel="Add your first professional"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professionals.map((p) => (
            <ProfessionalCard key={p.id} professional={p} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
