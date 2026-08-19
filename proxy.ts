import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js "proxy" convention (formerly "middleware"). Runs on every matched
// request to refresh the Supabase session and gate protected routes.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
