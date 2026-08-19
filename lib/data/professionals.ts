import { createClient } from "@/lib/supabase/server";
import type { Professional } from "@/lib/types";

/** All professionals owned by the current agent (RLS-scoped). */
export async function getProfessionals(): Promise<Professional[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professionals")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  return (data as Professional[]) ?? [];
}

/** A single professional the agent owns, or null. */
export async function getProfessional(
  id: string
): Promise<Professional | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Professional) ?? null;
}
