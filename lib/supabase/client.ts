import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Uses the public anon key and is fully governed by
 * Row Level Security — it can only ever see what the signed-in user is allowed
 * to see. Safe to use in Client Components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
