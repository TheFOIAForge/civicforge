"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Representative } from "@/data/types";
import { generateVerdicts } from "@/lib/compare-verdicts";
import RepSelector from "@/components/compare/RepSelector";
import TaleOfTheTape from "@/components/compare/TaleOfTheTape";
import ShareToolbar from "@/components/compare/ShareToolbar";
import AllComparisonSections from "@/components/compare/ComparisonSections";
import dynamic from "next/dynamic";

const AdvancedAnalytics = dynamic(
  () => import("@/components/compare/AdvancedAnalytics"),
  { ssr: false, loading: () => (
    <div className="mt-10 border-3 border-black bg-surface p-8 text-center">
      <div className="font-sans font-bold text-xl uppercase mb-2">Loading Advanced Analytics...</div>
      <p className="font-mono text-xs text-gray-mid">Preparing 8 visualization tabs</p>
    </div>
  )}
);

// ── Loading state ──

function LoadingComparison() {
  return (
    <div className="py-16 text-center">
      {/* Spinner */}
      <div className="inline-flex items-center justify-center w-20 h-20 border-3 border-black bg-surface mb-6">
        <svg className="animate-spin w-10 h-10 text-red" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <div className="font-sans font-bold text-2xl uppercase mb-2">Comparing Representatives</div>
      <p className="font-mono text-xs text-gray-mid uppercase tracking-wider mb-8">
        Loading voting records, funding data, and committee assignments...
      </p>

      {/* Skeleton sections */}
      <div className="space-y-6 motion-safe:animate-pulse text-left">
        {["Party Loyalty", "Attendance", "Legislation", "Funding"].map((label) => (
          <div key={label} className="border-3 border-border bg-surface">
            <div className="px-5 py-4 bg-cream-dark flex items-center gap-3">
              <div className="w-8 h-8 bg-parchment" />
              <div className="h-5 bg-parchment w-48" />
            </div>
            <div className="p-6">
              <div className="h-4 bg-cream-dark w-full mb-3" />
              <div className="flex gap-6">
                <div className="flex-1">
                  <div className="h-3 bg-cream-dark w-24 mb-2" />
                  <div className="h-10 bg-cream-dark w-full" />
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-cream-dark w-24 mb-2" />
                  <div className="h-10 bg-cream-dark w-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inner page (needs Suspense for useSearchParams) ──

function ComparePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [members, setMembers] = useState<Representative[]>([]);
  const [repA, setRepA] = useState<Representative | null>(null);
  const [repB, setRepB] = useState<Representative | null>(null);
  const [enrichedA, setEnrichedA] = useState<Representative | null>(null);
  const [enrichedB, setEnrichedB] = useState<Representative | null>(null);
  const [loading, setLoading] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);

  const tapeRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load all members on mount
  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data: Representative[]) => {
        setMembers(data);
        setMembersLoaded(true);
      })
      .catch(() => setMembersLoaded(true));
  }, []);

  // Resolve URL params to members once loaded
  useEffect(() => {
    if (!membersLoaded || members.length === 0) return;
    const slugA = searchParams.get("a");
    const slugB = searchParams.get("b");
    if (slugA && !repA) {
      const found = members.find(m => m.slug === slugA);
      if (found) setRepA(found);
    }
    if (slugB && !repB) {
      const found = members.find(m => m.slug === slugB);
      if (found) setRepB(found);
    }
  }, [membersLoaded, members, searchParams, repA, repB]);

  // Update URL when selections change
  const updateUrl = useCallback((a: Representative | null, b: Representative | null) => {
    const params = new URLSearchParams();
    if (a) params.set("a", a.slug);
    if (b) params.set("b", b.slug);
    const qs = params.toString();
    router.replace(qs ? `/compare?${qs}` : "/compare", { scroll: false });
  }, [router]);

  // Auto-compare when both are selected
  useEffect(() => {
    if (!repA || !repB) {
      setEnrichedA(null);
      setEnrichedB(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`/api/members/${repA.id}`).then(r => r.json()),
      fetch(`/api/members/${repB.id}`).then(r => r.json()),
    ])
      .then(([dataA, dataB]) => {
        if (cancelled) return;
        setEnrichedA(dataA);
        setEnrichedB(dataB);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [repA, repB]);

  // Scroll to results on mobile
  useEffect(() => {
    if (enrichedA && enrichedB && resultsRef.current) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [enrichedA, enrichedB]);

  const handleSelectA = useCallback((rep: Representative) => {
    setRepA(rep);
    updateUrl(rep, repB);
  }, [repB, updateUrl]);

  const handleSelectB = useCallback((rep: Representative) => {
    setRepB(rep);
    updateUrl(repA, rep);
  }, [repA, updateUrl]);

  const handleClearA = useCallback(() => {
    setRepA(null);
    setEnrichedA(null);
    updateUrl(null, repB);
  }, [repB, updateUrl]);

  const handleClearB = useCallback(() => {
    setRepB(null);
    setEnrichedB(null);
    updateUrl(repA, null);
  }, [repA, updateUrl]);

  const verdicts = enrichedA && enrichedB ? generateVerdicts(enrichedA, enrichedB) : null;

  // Check for embed mode
  const isEmbed = searchParams.get("embed") === "true";

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${isEmbed ? "py-4" : ""}`}>
      {/* Header */}
      <div data-print-hide>
        <div className="flex items-start gap-4 mb-8">
          <img src="/images/civic/icons/candidates.png" alt="" className="w-12 h-12 mt-1 opacity-80" aria-hidden="true" />
          <div>
            <h1 className="font-sans font-bold text-5xl md:text-6xl mb-2">
              Compare Representatives
            </h1>
            <p className="font-mono text-sm text-gray-mid font-bold uppercase tracking-wider">
              Side-by-side comparison of voting records, funding, legislation, and more
            </p>
          </div>
        </div>
      </div>

      {/* Selection area */}
      <div className="mb-8" data-print-hide>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_60px_1fr] gap-4 items-start">
          <RepSelector
            slot="A"
            members={members}
            selected={repA}
            otherSelected={repB}
            onSelect={handleSelectA}
            onClear={handleClearA}
          />
          <div className="hidden lg:flex items-center justify-center font-sans font-bold text-3xl text-red pt-12">
            VS
          </div>
          <RepSelector
            slot="B"
            members={members}
            selected={repB}
            otherSelected={repA}
            onSelect={handleSelectB}
            onClear={handleClearB}
          />
        </div>

        {/* Status message */}
        {!repA && !repB && (
          <div className="mt-6 text-center border-3 border-border bg-cream-dark px-6 py-8">
            <img src="/images/civic/icons/info.png" alt="" className="w-10 h-10 mx-auto mb-3 opacity-50" aria-hidden="true" />
            <div className="font-sans font-bold text-2xl mb-2">Pick Two Representatives</div>
            <p className="font-sans text-gray-mid">
              Select two members of Congress above to see a detailed side-by-side comparison
              with verdicts, infographics, and shareable results.
            </p>
          </div>
        )}

        {repA && !repB && (
          <div className="mt-4 text-center">
            <p className="font-mono text-sm text-gray-mid">
              Now select a second representative to compare with {repA.fullName}
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      <div ref={resultsRef}>
        {loading && <LoadingComparison />}

        {!loading && verdicts && enrichedA && enrichedB && (
          <div>
            {/* Tale of the Tape */}
            <TaleOfTheTape
              ref={tapeRef}
              repA={enrichedA}
              repB={enrichedB}
              verdicts={verdicts}
            />

            {/* Share Toolbar */}
            <ShareToolbar repA={enrichedA} repB={enrichedB} tapeRef={tapeRef} />

            {/* Jump-to nav */}
            <div className="flex flex-wrap gap-2 mb-8" data-print-hide>
              {verdicts.categories.map(cat => (
                <a
                  key={cat.key}
                  href={`#sec-${cat.key === "partyLoyalty" ? "loyalty" : cat.key === "votingRecord" ? "voting" : cat.key === "keyVotes" ? "keyvotes" : cat.key}`}
                  className="px-3 py-2 border-3 border-border font-mono text-xs font-bold uppercase no-underline text-gray-mid hover:border-black hover:text-black transition-colors"
                >
                  {cat.icon} {cat.label}
                </a>
              ))}
            </div>

            {/* All 8 Comparison Sections */}
            <AllComparisonSections
              repA={enrichedA}
              repB={enrichedB}
              verdicts={verdicts}
            />

            {/* Advanced Analytics — 8-tab deep analysis */}
            <AdvancedAnalytics repA={enrichedA} repB={enrichedB} />

            {/* Bottom CTA */}
            <div className="border-3 border-black bg-cream-dark p-8 text-center mt-8" data-print-hide>
              <img src="/images/civic/icons/fax.png" alt="" className="w-8 h-8 mx-auto mb-3 opacity-60" aria-hidden="true" />
              <h3 className="font-sans font-bold text-2xl uppercase mb-3">Take Action</h3>
              <p className="font-sans text-gray-mid mb-6">
                Now that you&apos;ve compared these representatives, make your voice heard.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href={`/draft?rep=${enrichedA.slug}`}
                  className="px-6 py-3 font-sans font-bold text-sm uppercase no-underline hover:opacity-90 transition-colors border-3 border-black"
                  style={{ backgroundColor: "#0A2540", color: "#F8F7F4" }}
                >
                  Write to {enrichedA.lastName}
                </a>
                <a
                  href={`/draft?rep=${enrichedB.slug}`}
                  className="px-6 py-3 bg-black text-cream font-sans font-bold text-sm uppercase no-underline hover:opacity-90 transition-colors border-3 border-black"
                >
                  Write to {enrichedB.lastName}
                </a>
                <a
                  href="/directory"
                  className="px-6 py-3 bg-surface text-black font-sans font-bold text-sm uppercase no-underline hover:bg-cream-dark transition-colors border-3 border-black"
                >
                  Compare Others
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page Export (with Suspense for useSearchParams) ──

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-sans font-bold text-5xl md:text-6xl mb-2">Compare Representatives</h1>
        <p className="font-mono text-sm text-gray-mid mb-8 font-bold uppercase tracking-wider">Loading...</p>
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}
