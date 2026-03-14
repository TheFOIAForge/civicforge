import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error_description = searchParams.get("error_description");

  // Handle OAuth/email confirmation errors from Supabase
  if (error_description) {
    const msg = encodeURIComponent(error_description);
    return NextResponse.redirect(`${origin}/?auth_error=${msg}`);
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Successful login — redirect with success flag
        return NextResponse.redirect(`${origin}${next}?auth_success=true`);
      }
      // Code exchange failed
      const msg = encodeURIComponent(error.message || "Authentication failed. Please try again.");
      return NextResponse.redirect(`${origin}/?auth_error=${msg}`);
    }
  }

  // No code provided — something went wrong
  return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent("Authentication link expired or invalid. Please try again.")}`);
}
