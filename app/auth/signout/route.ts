import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/constants";

// POST /auth/signout — clears the session and returns to the login page.
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", APP_URL), { status: 303 });
}
