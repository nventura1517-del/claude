import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function TrackPage() {
  const profile = await requireRole(["buyer"]);

  return (
    <AppShell role="buyer" userName={profile.full_name}>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Your home purchase
      </h1>
      <p className="mt-2 text-muted">
        Your progress tracker will appear here once your agent sets up your
        transaction.
      </p>
    </AppShell>
  );
}
