import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { ProfessionalForm } from "@/components/ProfessionalForm";
import {
  updateProfessionalAction,
  deleteProfessionalAction,
} from "@/app/network/actions";
import { getProfessional } from "@/lib/data/professionals";

export default async function EditProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["agent"]);
  const { id } = await params;
  const professional = await getProfessional(id);
  if (!professional) notFound();

  return (
    <AppShell role="agent" userName={profile.full_name}>
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Edit professional
        </h1>
        <div className="mt-6">
          <ProfessionalForm
            action={updateProfessionalAction}
            professional={professional}
            submitLabel="Save changes"
          />
        </div>

        <form
          action={deleteProfessionalAction}
          className="mt-8 border-t border-line pt-6"
        >
          <input type="hidden" name="id" value={professional.id} />
          <button
            type="submit"
            className="text-sm font-medium text-danger hover:underline"
          >
            Remove from network
          </button>
        </form>
      </div>
    </AppShell>
  );
}
