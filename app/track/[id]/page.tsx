import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BuyerTracker } from "@/components/buyer/BuyerTracker";
import { getBuyerTransactions } from "@/lib/data/transactions";

export default async function BuyerTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["buyer"]);
  const { id } = await params;

  // RLS already restricts these to the buyer's own transactions.
  const views = await getBuyerTransactions();
  const view = views.find((v) => v.transaction.id === id);
  if (!view) notFound();

  return (
    <AppShell role="buyer" userName={profile.full_name}>
      <BuyerTracker view={view} />
    </AppShell>
  );
}
