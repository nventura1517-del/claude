import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { ProfessionalForm } from "@/components/ProfessionalForm";
import { createProfessionalAction } from "@/app/network/actions";

export default async function NewProfessionalPage() {
  const profile = await requireRole(["agent"]);

  return (
    <AppShell role="agent" userName={profile.full_name}>
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Add a professional
        </h1>
        <p className="mt-1 text-sm text-muted">
          Only you can see your network. You choose who to recommend on each
          transaction.
        </p>
        <div className="mt-6">
          <ProfessionalForm
            action={createProfessionalAction}
            submitLabel="Add to network"
          />
        </div>
      </div>
    </AppShell>
  );
}
