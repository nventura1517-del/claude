import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function DashboardPage() {
  const profile = await requireRole(["agent"]);

  return (
    <AppShell role="agent" userName={profile.full_name}>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Transactions
      </h1>
      <p className="mt-2 text-muted">
        Your active home purchases will appear here. Transaction creation lands
        in the next phase.
      </p>
    </AppShell>
  );
}
