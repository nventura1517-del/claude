import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { NewTransactionForm } from "@/components/NewTransactionForm";

export default async function NewTransactionPage() {
  const profile = await requireRole(["agent"]);

  return (
    <AppShell role="agent" userName={profile.full_name}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          New transaction
        </h1>
        <p className="mt-1 text-sm text-muted">
          We&rsquo;ll create the standard homebuying milestones automatically.
        </p>
        <div className="mt-6">
          <NewTransactionForm />
        </div>
      </div>
    </AppShell>
  );
}
