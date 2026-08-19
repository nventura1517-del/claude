"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { isValidCategory } from "@/lib/professionals/categories";

export type ProfessionalFormState = { error: string | null };

function readForm(formData: FormData) {
  const s = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    name: s("name"),
    company: s("company") || null,
    category: s("category"),
    phone: s("phone") || null,
    email: s("email").toLowerCase() || null,
    website: s("website") || null,
    notes: s("notes") || null,
  };
}

function validate(input: ReturnType<typeof readForm>): string | null {
  if (!input.name) return "Enter the professional's name.";
  if (!isValidCategory(input.category)) return "Choose a valid category.";
  return null;
}

export async function createProfessionalAction(
  _prev: ProfessionalFormState,
  formData: FormData
): Promise<ProfessionalFormState> {
  const agent = await requireRole(["agent"]);
  const input = readForm(formData);
  const error = validate(input);
  if (error) return { error };

  const supabase = await createClient();
  const { error: insertError } = await supabase
    .from("professionals")
    .insert({ ...input, agent_id: agent.id });

  if (insertError) return { error: "Could not save. Please try again." };

  revalidatePath("/network");
  redirect("/network");
}

export async function updateProfessionalAction(
  _prev: ProfessionalFormState,
  formData: FormData
): Promise<ProfessionalFormState> {
  await requireRole(["agent"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing professional." };

  const input = readForm(formData);
  const error = validate(input);
  if (error) return { error };

  const supabase = await createClient();
  // RLS ensures the agent can only update their own row.
  const { error: updateError } = await supabase
    .from("professionals")
    .update(input)
    .eq("id", id);

  if (updateError) return { error: "Could not save. Please try again." };

  revalidatePath("/network");
  redirect("/network");
}

export async function deleteProfessionalAction(formData: FormData) {
  await requireRole(["agent"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("professionals").delete().eq("id", id);
  revalidatePath("/network");
  redirect("/network");
}
