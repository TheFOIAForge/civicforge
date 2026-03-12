"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { issues, getIssueBySlug } from "@/data/issues";
import { buildSystemPrompt } from "@/lib/prompts";
import type { Representative } from "@/data/types";

type Mode = "letter" | "call" | "social";

const modeLabels: Record<Mode, { label: string; emoji: string; desc: string }> = {
  letter: { label: "Letter", emoji: "\u{2709}\u{FE0F}", desc: "Formal advocacy letter for email or mail" },
  call: { label: "Call Script", emoji: "\u{1F4DE}", desc: "Talking points for calling their office" },
  social: { label: "Social Post", emoji: "\u{1F4F1}", desc: "Posts to tag them on social media" },
};

function DraftInner() {
  const searchParams = useSearchParams();
  const [allReps, setAllReps] = useState<Representative[]>([]);
  const [mode, setMode] = useState<Mode>(
    (searchParams.get("mode") as Mode) || "letter"
  );
  const [selectedRepSlug, setSelectedRepSlug] = useState(
    searchParams.get("rep") || ""
  );
  const [selectedIssueSlug, setSelectedIssueSlug] = useState(
    searchParams.get("issue") || ""
  );
  const [concern, setConcern] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setAllReps)
      .catch(() => {});
  }, []);

  const selectedRep = selectedRepSlug
    ? allReps.find((r) => r.slug === selectedRepSlug)
    : undefined;
  const selectedIssue = selectedIssueSlug ? getIssueBySlug(selectedIssueSlug) : undefined;

  function getApiKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("civicforge_api_key");
  }

  async function handleGenerate() {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("No API key found. Go to Settings to add your Anthropic API key.");
      return;
    }
    if (!selectedRep) {
      setError("Please select a representative.");
      return;
    }
    if (!concern.trim()) {
      setError("Please describe your concern.");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    const systemPrompt = buildSystemPrompt(mode, selectedRep, selectedIssue);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `My concern: ${concern}\n\nMy location: [CITY, STATE] (the user will fill this in)\n\nPlease draft the ${mode === "letter" ? "letter" : mode === "call" ? "call script" : "social media posts"}.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "No response generated. Please try again.";
      setOutput(text);

      // Auto-log to contact tracker
      try {
        const logs = JSON.parse(localStorage.getItem("civicforge_contacts") || "[]");
        logs.push({
          id: Date.now().toString(),
          repId: selectedRep.id,
          repName: selectedRep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          date: new Date().toISOString().split("T")[0],
          status: "sent",
          notes: concern.slice(0, 100),
          content: text.slice(0, 500),
        });
        localStorage.setItem("civicforge_contacts", JSON.stringify(logs));
      } catch {
        // Silently fail on storage errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getMailtoLink() {
    if (!selectedRep || !output) return "";
    const subject = encodeURIComponent(`Constituent Letter: ${selectedIssue?.name || "Important Issue"}`);
    const body = encodeURIComponent(output);
    return `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Take Action</h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        AI-POWERED DRAFTING WITH REP CONTEXT + ANTI-SLOP RULES
      </p>

      {/* Mode tabs */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {(["letter", "call", "social"] as Mode[]).map((m) => {
          const info = modeLabels[m];
          return (
            <button
              key={m}
              onClick={() => { setMode(m); setOutput(""); }}
              className={`px-6 py-4 font-headline uppercase text-base border-3 border-border cursor-pointer transition-colors ${
                mode === m
                  ? "bg-red text-white border-red"
                  : "bg-surface text-black hover:bg-hover"
              }`}
            >
              <span className="text-2xl block mb-1">{info.emoji}</span>
              {info.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input column */}
        <div className="border-3 border-border p-6 bg-surface">
          <h2 className="font-headline text-2xl mb-5">
            {modeLabels[mode].emoji} {modeLabels[mode].desc}
          </h2>

          {/* Rep selector */}
          <div className="mb-5">
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">
              SELECT REPRESENTATIVE
            </label>
            <select
              value={selectedRepSlug}
              onChange={(e) => setSelectedRepSlug(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border bg-cream font-mono text-base focus:outline-none focus:border-red"
            >
              <option value="">Choose a representative...</option>
              {allReps.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.fullName} ({r.party}) — {r.title}, {r.state}
                </option>
              ))}
            </select>
          </div>

          {/* Issue selector */}
          <div className="mb-5">
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">
              SELECT ISSUE (OPTIONAL)
            </label>
            <select
              value={selectedIssueSlug}
              onChange={(e) => setSelectedIssueSlug(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border bg-cream font-mono text-base focus:outline-none focus:border-red"
            >
              <option value="">No specific issue</option>
              {issues.map((iss) => (
                <option key={iss.id} value={iss.slug}>{iss.name}</option>
              ))}
            </select>
          </div>

          {/* Concern input */}
          <div className="mb-5">
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">
              DESCRIBE YOUR CONCERN
            </label>
            <textarea
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="What issue matters to you? Why? What do you want your representative to do about it?"
              rows={6}
              className="w-full px-4 py-3 border-2 border-border bg-cream font-body text-base focus:outline-none focus:border-red resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 border-3 border-status-red bg-status-red text-white font-mono text-sm font-bold">
              {error}
              {error.includes("API key") && (
                <Link href="/settings" className="text-white/80 ml-2 underline">
                  Go to Settings
                </Link>
              )}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full px-6 py-4 font-headline uppercase text-lg tracking-wider border-3 cursor-pointer transition-colors ${
              loading
                ? "bg-gray-mid text-white border-gray-mid"
                : "bg-red text-white border-red hover:bg-red-dark hover:border-red-dark"
            }`}
          >
            {loading
              ? "Generating..."
              : `Generate ${modeLabels[mode].label}`}
          </button>

          {/* Context preview */}
          {selectedRep && (
            <div className="mt-5 p-4 bg-red-light border-2 border-border-light">
              <p className="font-mono text-sm text-red font-bold mb-1">
                AI CONTEXT INJECTION:
              </p>
              <p className="font-mono text-sm text-gray-mid">
                {selectedRep.fullName}&apos;s {selectedRep.committees.length} committees, voting record ({selectedRep.votesCast.toLocaleString()} votes), {selectedRep.keyVotes.length} key votes
                {selectedIssue ? `, and ${selectedIssue.legislation.length} active bills on ${selectedIssue.name}` : ""}
              </p>
            </div>
          )}
        </div>

        {/* Output column */}
        <div className="border-3 border-border p-6 bg-surface min-h-[500px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-headline text-2xl">
              {output
                ? mode === "letter" ? "Your Letter" : mode === "call" ? "Your Call Script" : "Your Posts"
                : "Output"}
            </h2>
            {output && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-black text-white font-mono text-sm cursor-pointer hover:bg-green transition-colors font-bold"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                {mode === "letter" && (
                  <a
                    href={getMailtoLink()}
                    className="px-4 py-2 bg-red text-white font-mono text-sm no-underline hover:bg-red-dark transition-colors font-bold"
                  >
                    Open in Email
                  </a>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <div className="font-headline text-3xl mb-3 animate-pulse text-red">
                  Drafting...
                </div>
                <p className="font-mono text-sm text-gray-mid font-bold">
                  Injecting rep context + applying anti-slop rules
                </p>
              </div>
            </div>
          ) : output ? (
            <div className="font-body text-base leading-relaxed whitespace-pre-wrap border-2 border-border-light p-5 bg-cream">
              {output}
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-center">
              <div>
                <p className="font-headline text-2xl text-gray-light mb-3">
                  {modeLabels[mode].emoji}
                </p>
                <p className="font-headline text-xl text-gray-mid">
                  Select a rep, describe your concern, hit generate.
                </p>
                <p className="font-mono text-sm text-gray-mid mt-3">
                  Your API key stays in your browser. Nothing is sent to our servers.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DraftPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-headline text-5xl md:text-6xl mb-2">Take Action</h1>
        <p className="font-mono text-sm text-gray-mid">Loading...</p>
      </div>
    }>
      <DraftInner />
    </Suspense>
  );
}
