import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

/**
 * Returns the signed-in user's profile, or null if not signed in. Uses the
 * RLS-scoped server client, so it can only ever read the caller's own profile.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/**
 * Requires a signed-in user with a profile; redirects to /login otherwise.
 * Returns the profile for use in the page.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/**
 * Requires the signed-in user to have one of the allowed roles. Sends users to
 * their own home if their role is not allowed here.
 */
export async function requireRole(allowed: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) redirect(homePathForRole(profile.role));
  return profile;
}

/** Where a given role lands after login. */
export function homePathForRole(role: Role): string {
  return role === "buyer" ? "/track" : "/dashboard";
}
