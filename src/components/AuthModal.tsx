"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

type AuthTab = "login" | "signup";

export default function AuthModal() {
  const {
    showAuthModal,
    setShowAuthModal,
    authModalMessage,
    signInWithOAuth,
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

  async function handleOAuth(provider: "google" | "apple" | "facebook" | "twitter" | "discord") {
    setError("");
    await signInWithOAuth(provider);
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !emailSent) close(); }}
    >
      <div className="w-full max-w-md overflow-hidden" style={{ border: "4px solid #c4a44a" }}>
        {/* Header */}
        <div
          className="px-6 py-6 text-center relative overflow-hidden"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "url(/images/propaganda/hero-poster.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative z-10">
            <h2 className="font-headline text-2xl uppercase m-0 tracking-wide" style={{ color: "#f5e6c8" }}>
              {emailSent ? "Almost There" : tab === "signup" ? "Join CheckMyRep" : "Welcome Back"}
            </h2>
            {authModalMessage && !emailSent && (
              <p className="font-mono text-[11px] mt-2" style={{ color: "#c4a44a" }}>
                {authModalMessage}
              </p>
            )}
          </div>
        </div>

        {emailSent ? (
          /* Email Confirmation Screen */
          <div className="px-6 py-8 text-center" style={{ backgroundColor: "#f5e6c8" }}>
            <div
              className="w-20 h-20 mx-auto mb-5 flex items-center justify-center"
              style={{ backgroundColor: "#C1272D", border: "3px solid #1a1a1a" }}
            >
              <span className="text-3xl" style={{ filter: "brightness(10)" }}>&#9993;</span>
            </div>

            <h3 className="font-headline text-2xl uppercase mb-3" style={{ color: "#1a1a1a" }}>
              Check Your Email
            </h3>

            <div
              className="mx-auto mb-4 px-4 py-3"
              style={{ backgroundColor: "#faf6ee", border: "2px solid #1a1a1a" }}
            >
              <p className="font-mono text-sm font-bold" style={{ color: "#1a1a1a" }}>
                {email}
              </p>
            </div>

            <p className="font-body text-sm leading-relaxed mb-6" style={{ color: "#3a3a3a" }}>
              We sent a confirmation link to your email.
              Click the link to activate your account, then come back and log in.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setTab("login");
                  setPassword("");
                }}
                className="w-full py-3.5 font-headline text-base uppercase cursor-pointer tracking-wide"
                style={{ backgroundColor: "#C1272D", color: "#f5e6c8", border: "3px solid #1a1a1a" }}
              >
                I Confirmed — Log In
              </button>
              <button
                onClick={close}
                className="w-full py-2.5 font-mono text-xs cursor-pointer border-none"
                style={{ backgroundColor: "transparent", color: "#8a8a8a" }}
              >
                I&apos;ll do it later
              </button>
            </div>

            <div className="mt-5 pt-4" style={{ borderTop: "2px solid #e8d5ad" }}>
              <p className="font-mono text-[10px]" style={{ color: "#8a8a8a" }}>
                Didn&apos;t get it? Check your spam folder or try a different email.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5" style={{ backgroundColor: "#f5e6c8" }}>
            {/* Tab toggle */}
            <div className="flex mb-4" style={{ border: "3px solid #1a1a1a" }}>
              <button
                onClick={() => { setTab("signup"); setError(""); }}
                className="flex-1 py-2.5 font-mono text-xs font-bold uppercase cursor-pointer border-none"
                style={{
                  backgroundColor: tab === "signup" ? "#1a1a1a" : "#faf6ee",
                  color: tab === "signup" ? "#f5e6c8" : "#8a8a8a",
                }}
              >
                Sign Up
              </button>
              <button
                onClick={() => { setTab("login"); setError(""); }}
                className="flex-1 py-2.5 font-mono text-xs font-bold uppercase cursor-pointer border-none"
                style={{
                  backgroundColor: tab === "login" ? "#1a1a1a" : "#faf6ee",
                  color: tab === "login" ? "#f5e6c8" : "#8a8a8a",
                }}
              >
                Log In
              </button>
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleOAuth("google")}
                className="flex items-center justify-center gap-2 py-2.5 font-mono text-[11px] font-bold cursor-pointer"
                style={{ backgroundColor: "#faf6ee", border: "2px solid #1a1a1a", color: "#1a1a1a" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                onClick={() => handleOAuth("apple")}
                className="flex items-center justify-center gap-2 py-2.5 font-mono text-[11px] font-bold cursor-pointer"
                style={{ backgroundColor: "#1a1a1a", border: "2px solid #1a1a1a", color: "#f5e6c8" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#f5e6c8">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple
              </button>
              <button
                onClick={() => handleOAuth("facebook")}
                className="flex items-center justify-center gap-2 py-2.5 font-mono text-[11px] font-bold cursor-pointer"
                style={{ backgroundColor: "#1877F2", border: "2px solid #1a1a1a", color: "#fff" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
              <button
                onClick={() => handleOAuth("twitter")}
                className="flex items-center justify-center gap-2 py-2.5 font-mono text-[11px] font-bold cursor-pointer"
                style={{ backgroundColor: "#1a1a1a", border: "2px solid #1a1a1a", color: "#f5e6c8" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f5e6c8">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X / Twitter
              </button>
              <button
                onClick={() => handleOAuth("discord")}
                className="col-span-2 flex items-center justify-center gap-2 py-2.5 font-mono text-[11px] font-bold cursor-pointer"
                style={{ backgroundColor: "#5865F2", border: "2px solid #1a1a1a", color: "#fff" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
                </svg>
                Discord
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: "#1a1a1a" }} />
              <span className="font-mono text-[10px] font-bold" style={{ color: "#8a8a8a" }}>OR USE EMAIL</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#1a1a1a" }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === "signup" && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 font-mono text-sm"
                  style={{ border: "2px solid #1a1a1a", backgroundColor: "#faf6ee", color: "#1a1a1a", outline: "none" }}
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 font-mono text-sm"
                style={{ border: "2px solid #1a1a1a", backgroundColor: "#faf6ee", color: "#1a1a1a", outline: "none" }}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 font-mono text-sm"
                style={{ border: "2px solid #1a1a1a", backgroundColor: "#faf6ee", color: "#1a1a1a", outline: "none" }}
              />

              {error && (
                <div className="px-3 py-2" style={{ backgroundColor: "#f5d5d0", border: "2px solid #C1272D" }}>
                  <p className="font-mono text-xs font-bold" style={{ color: "#C1272D" }}>
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-headline text-base uppercase cursor-pointer tracking-wide"
                style={{ backgroundColor: "#C1272D", color: "#f5e6c8", border: "3px solid #1a1a1a" }}
              >
                {loading ? "..." : tab === "signup" ? "Create Account" : "Log In"}
              </button>
            </form>

            {/* Benefits (signup only) */}
            {tab === "signup" && (
              <div className="mt-4 p-3" style={{ backgroundColor: "#faf6ee", border: "2px solid #1a1a1a" }}>
                <p className="font-mono text-[10px] font-bold mb-2" style={{ color: "#5a5a5a" }}>
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
                      <span style={{ color: "#C1272D", fontSize: "12px" }}>&#9733;</span>
                      <span className="font-mono text-[11px]" style={{ color: "#3a3a3a" }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Close */}
            <button
              onClick={close}
              className="w-full mt-3 py-2 font-mono text-xs text-center cursor-pointer border-none"
              style={{ backgroundColor: "transparent", color: "#8a8a8a" }}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
