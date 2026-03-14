import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    // Return a dummy client that no-ops — prevents crashes when Supabase isn't configured
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: async () => ({ data: { url: null, provider: "" as never }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ limit: async () => ({ data: [], error: null }) }), neq: () => ({ data: [], error: null, count: 0 }) }), data: [], error: null, count: 0 }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }), data: null, error: null }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
        upsert: async () => ({ data: null, error: null }),
      }),
    } as unknown as SupabaseClient;
  }

  if (!client) {
    client = createBrowserClient(supabaseUrl!, supabaseAnonKey!);
  }
  return client;
}
