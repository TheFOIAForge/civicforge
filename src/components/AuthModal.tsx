"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { X, Check, Mail as MailIcon } from "lucide-react";
import Button from "@/components/ui/Button";

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
      style={{ backgroundColor: "rgba(10, 37, 64, 0.9)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !emailSent) close(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl relative">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 p-1.5 text-gray-400 hover:text-navy rounded-lg transition-colors cursor-pointer bg-transparent border-none"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-hero px-6 py-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 pattern-dots opacity-[0.05]" />
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center mx-auto mb-3">
              <img src="/images/civic/icons/capitol.png" alt="" className="w-6 h-6 opacity-90" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {emailSent ? "Check Your Email" : tab === "signup" ? "Join CheckMyRep" : "Welcome Back"}
            </h2>
            {authModalMessage && !emailSent && (
              <p className="text-sm text-white/60 mt-1">{authModalMessage}</p>
            )}
          </div>
        </div>

        {emailSent ? (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 flex items-center justify-center">
              <MailIcon className="w-8 h-8 text-teal" />
            </div>
            <div className="mx-auto mb-4 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-navy">{email}</p>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              We sent a confirmation link. Click the link to activate your account, then come back and log in.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => { setEmailSent(false); setTab("login"); setPassword(""); }}
                variant="primary"
                className="w-full"
              >
                I Confirmed — Log In
              </Button>
              <button onClick={close} className="w-full py-2 text-xs text-gray-400 cursor-pointer bg-transparent border-none">
                I&apos;ll do it later
              </button>
            </div>
            <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
              Didn&apos;t get it? Check spam or try a different email.
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Tab toggle */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
              <button
                onClick={() => { setTab("signup"); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all border-none
                  ${tab === "signup" ? "bg-white text-navy shadow-sm" : "text-gray-500 bg-transparent"}`}
              >
                Sign Up
              </button>
              <button
                onClick={() => { setTab("login"); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all border-none
                  ${tab === "login" ? "bg-white text-navy shadow-sm" : "text-gray-500 bg-transparent"}`}
              >
                Log In
              </button>
            </div>

            {/* Social login */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                onClick={() => handleOAuth("google")}
                className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl cursor-pointer
                  bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-all"
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
                className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl cursor-pointer
                  bg-navy border border-navy text-white hover:bg-navy-light transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple
              </button>
              <button
                onClick={() => handleOAuth("facebook")}
                className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl cursor-pointer
                  bg-[#1877F2] border border-[#1877F2] text-white hover:opacity-90 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
              <button
                onClick={() => handleOAuth("twitter")}
                className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl cursor-pointer
                  bg-gray-900 border border-gray-900 text-white hover:bg-gray-800 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or use email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === "signup" && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                    placeholder:text-gray-400 focus:bg-white focus:border-navy focus:outline-none transition-all"
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                  placeholder:text-gray-400 focus:bg-white focus:border-navy focus:outline-none transition-all"
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                  placeholder:text-gray-400 focus:bg-white focus:border-navy focus:outline-none transition-all"
              />

              {error && (
                <div className="px-3 py-2 bg-red-light border border-red/20 rounded-xl">
                  <p className="text-xs font-medium text-red">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {tab === "signup" ? "Create Account" : "Log In"}
              </Button>
            </form>

            {/* Benefits */}
            {tab === "signup" && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-2">Why create an account?</p>
                <ul className="space-y-1.5">
                  {[
                    "Track your letters, calls, and emails",
                    "Earn points and level up",
                    "See delivery status of mailed letters",
                    "Your data syncs across devices",
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal shrink-0" />
                      <span className="text-xs text-gray-600">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skip */}
            <button
              onClick={close}
              className="w-full mt-3 py-2 text-xs text-gray-400 cursor-pointer bg-transparent border-none"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
