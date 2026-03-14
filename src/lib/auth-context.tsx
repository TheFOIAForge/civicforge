"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { User, Session } from "@supabase/supabase-js";

interface Engagement {
  total_points: number;
  level: string;
  letters_sent: number;
  calls_made: number;
  emails_sent: number;
  letters_mailed: number;
  unique_reps: number;
  unique_issues: number;
  streak_days: number;
  longest_streak: number;
  last_action_at: string | null;
}

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  engagement: Engagement | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshEngagement: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMessage: string;
  setAuthModalMessage: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  engagement: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signOut: async () => {},
  refreshEngagement: async () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
  authModalMessage: "",
  setAuthModalMessage: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
  }, [supabase]);

  const refreshEngagement = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("engagement")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setEngagement(data);
  }, [supabase, user]);

  // Migrate localStorage data to Supabase on first login
  const migrateLocalData = useCallback(async (userId: string) => {
    const migrated = localStorage.getItem("checkmyrep_migrated_to_supabase");
    if (migrated) return;

    try {
      // Migrate saved reps
      const savedReps = JSON.parse(localStorage.getItem("checkmyrep_my_reps") || "[]");
      if (savedReps.length > 0) {
        const repsToInsert = savedReps.map((rep: { id: string; fullName: string }) => ({
          user_id: userId,
          rep_id: rep.id,
          rep_name: rep.fullName,
          rep_data: rep,
        }));
        await supabase.from("saved_reps").upsert(repsToInsert, { onConflict: "user_id,rep_id" });
      }

      // Migrate contact log entries as actions
      const contacts = JSON.parse(localStorage.getItem("checkmyrep_contacts") || "[]");
      if (contacts.length > 0) {
        const actionsToInsert = contacts.map((c: Record<string, string>) => ({
          user_id: userId,
          rep_id: c.repId || "",
          rep_name: c.repName || "",
          method: c.method || "letter",
          issue: c.issue || "",
          content: c.content || "",
          delivery_status: c.deliveryStatus || "drafted",
          emailed_at: c.emailedAt || null,
          called_at: c.calledAt || null,
          mailed_at: c.mailedAt || null,
          stripe_session_id: c.stripeSessionId || null,
          lob_letter_id: c.lobLetterId || null,
          lob_tracking_url: c.lobTrackingUrl || null,
          expected_delivery_date: c.expectedDeliveryDate || null,
          created_at: c.date ? new Date(c.date).toISOString() : new Date().toISOString(),
        }));
        await supabase.from("actions").insert(actionsToInsert);
      }

      // Migrate address
      try {
        const addr = JSON.parse(localStorage.getItem("checkmyrep_sender_address") || "{}");
        if (addr.address_line1) {
          await supabase.from("profiles").update({
            address_line1: addr.address_line1,
            address_city: addr.address_city,
            address_state: addr.address_state,
            address_zip: addr.address_zip,
          }).eq("id", userId);
        }
      } catch { /* ignore */ }

      localStorage.setItem("checkmyrep_migrated_to_supabase", "true");
    } catch (err) {
      console.error("Migration error:", err);
    }
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }: { data: { session: Session | null } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, s: Session | null) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchProfile(s.user.id);
          await migrateLocalData(s.user.id);
        } else {
          setProfile(null);
          setEngagement(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, migrateLocalData]);

  // Fetch engagement when user changes
  useEffect(() => {
    if (user) refreshEngagement();
  }, [user, refreshEngagement]);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setShowAuthModal(false);
    return { error: null };
  }

  async function signUpWithEmail(email: string, password: string, name: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { error: error.message };
    setShowAuthModal(false);
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setEngagement(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        engagement,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshEngagement,
        showAuthModal,
        setShowAuthModal,
        authModalMessage,
        setAuthModalMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
