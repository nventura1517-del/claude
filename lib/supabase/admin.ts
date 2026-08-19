import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * SERVICE-ROLE Supabase client. This BYPASSES Row Level Security and must NEVER
 * be imported into client code. The `server-only` import above makes the build
 * fail if this module is ever pulled into a Client Component.
 *
 * Use only for the narrow set of privileged operations RLS cannot express
 * (e.g. accepting an invitation and creating the participant row). Prefer the
 * RLS-scoped client in `server.ts` for everything else.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
