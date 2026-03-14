"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

type AuthTab = "login" | "signup";

export default function AuthModal() {
  const {
    showAuthModal,
    setShowAuthModal,
    authModalMessage,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const [tab, setTab] = useState<AuthTab>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!showAuthModal) return null;

  function close() {
    setShowAuthModal(false);
    setError("");
    setEmailSent(false);
  }

  async function handleGoogle() {
    setError("");
    await signInWithGoogle();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (tab === "signup") {
      if (!name.trim()) {
        setError("Please enter your name");
        setLoading(false);
        return;
      }
      const { error: err } = await signUpWithEmail(email, password, name);
      if (err) {
        setError(err);
      } else {
        setEmailSent(true);
      }
    } else {
      const { error: err } = await signInWithEmail(email, password);
      if (err) setError(err);
    }

    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="w-full max-w-md mx-4" style={{ backgroundColor: "#fff" }}>
        {/* Header */}
        <div className="p-5 text-center" style={{ backgroundColor: "#C1272D" }}>
          <h2 className="font-headline text-2xl text-white uppercase m-0">
            {tab === "signup" ? "Join CheckMyRep" : "Welcome Back"}
          </h2>
          {authModalMessage && (
            <p className="font-mono text-[11px] mt-2 text-white/80">
              {authModalMessage}
            </p>
          )}
        </div>

        {emailSent ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">&#9993;</div>
            <h3 className="font-headline text-xl mb-2" style={{ color: "#111" }}>
              Check Your Email
            </h3>
            <p className="font-body text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
              We sent a confirmation link to <strong>{email}</strong>.
              Click the link to activate your account.
            </p>
            <button
              onClick={close}
              className="mt-4 px-6 py-3 font-mono text-xs font-bold uppercase cursor-pointer border-none"
              style={{ backgroundColor: "#C1272D", color: "#fff" }}
            >
              Got It
            </button>
          </div>
        ) : (
          <div className="p-5">
            {/* Tab toggle */}
            <div className="flex mb-4" style={{ border: "2px solid rgba(0,0,0,0.1)" }}>
              <button
                onClick={() => { setTab("signup"); setError(""); }}
                className="flex-1 py-2.5 font-mono text-xs font-bold uppercase cursor-pointer border-none"
                style={{
                  backgroundColor: tab === "signup" ? "#111" : "transparent",
                  color: tab === "signup" ? "#fff" : "rgba(0,0,0,0.4)",
                }}
              >
                Sign Up
              </button>
              <button
                onClick={() => { setTab("login"); setError(""); }}
                className="flex-1 py-2.5 font-mono text-xs font-bold uppercase cursor-pointer border-none"
                style={{
                  backgroundColor: tab === "login" ? "#111" : "transparent",
                  color: tab === "login" ? "#fff" : "rgba(0,0,0,0.4)",
                }}
              >
                Log In
              </button>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 mb-4 font-mono text-sm font-bold cursor-pointer"
              style={{
                backgroundColor: "#fff",
                border: "2px solid rgba(0,0,0,0.15)",
                color: "#111",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: "rgba(0,0,0,0.1)" }} />
              <span className="font-mono text-[10px] font-bold" style={{ color: "rgba(0,0,0,0.3)" }}>OR</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "rgba(0,0,0,0.1)" }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === "signup" && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 font-mono text-sm border-2"
                  style={{ borderColor: "rgba(0,0,0,0.12)", backgroundColor: "rgba(0,0,0,0.02)" }}
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 font-mono text-sm border-2"
                style={{ borderColor: "rgba(0,0,0,0.12)", backgroundColor: "rgba(0,0,0,0.02)" }}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 font-mono text-sm border-2"
                style={{ borderColor: "rgba(0,0,0,0.12)", backgroundColor: "rgba(0,0,0,0.02)" }}
              />

              {error && (
                <p className="font-mono text-xs font-bold" style={{ color: "#C1272D" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-headline text-lg uppercase cursor-pointer border-none"
                style={{ backgroundColor: "#C1272D", color: "#fff" }}
              >
                {loading ? "..." : tab === "signup" ? "Create Account" : "Log In"}
              </button>
            </form>

            {/* Benefits (signup only) */}
            {tab === "signup" && (
              <div className="mt-4 p-3" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}>
                <p className="font-mono text-[10px] font-bold mb-2" style={{ color: "rgba(0,0,0,0.5)" }}>
                  WHY CREATE AN ACCOUNT?
                </p>
                <ul className="space-y-1">
                  {[
                    "Track your letters, calls, and emails",
                    "Earn points and level up your activism",
                    "See delivery status of mailed letters",
                    "Your data syncs across devices",
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <span style={{ color: "#16a34a", fontSize: "12px" }}>&#10003;</span>
                      <span className="font-mono text-[11px]" style={{ color: "rgba(0,0,0,0.6)" }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Close */}
            <button
              onClick={close}
              className="w-full mt-3 py-2 font-mono text-xs text-center cursor-pointer border-none"
              style={{ backgroundColor: "transparent", color: "rgba(0,0,0,0.4)" }}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
