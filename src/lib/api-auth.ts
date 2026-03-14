/**
 * Authentication helpers for API routes.
 *
 * Usage:
 *   const { user, error } = await requireAuth(request);
 *   if (error) return error; // 401 response
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function getUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // API routes don't need to set cookies
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { user, error: null };
}
