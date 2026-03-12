"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Committee } from "@/data/types";

export default function CommitteeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/committees/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setCommittee)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="motion-safe:animate-pulse">
          <div className="h-8 bg-border-light w-96 mb-4" />
          <div className="h-4 bg-border-light w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-3 border-border p-5 bg-surface">
                <div className="h-4 bg-border-light w-3/4 mb-2" />
                <div className="h-4 bg-border-light w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !committee) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="font-headline text-4xl mb-4">Committee Not Found</h1>
        <p className="font-body text-base text-gray-mid mb-6">
          This committee could not be loaded. It may not exist in the current Congress.
        </p>
        <Link
          href="/committees"
          className="inline-block px-6 py-3 bg-black text-white font-headline uppercase no-underline hover:bg-red transition-colors"
        >
          View All Committees
        </Link>
      </div>
    );
  }

  const chamberColor =
    committee.chamber === "Senate" ? "bg-blue-900" :
    committee.chamber === "House" ? "bg-red" : "bg-black";

  // Group members by party
  const dems = committee.members.filter((m) => m.party === "D");
  const reps = committee.members.filter((m) => m.party === "R");
  const inds = committee.members.filter((m) => m.party !== "D" && m.party !== "R");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="font-mono text-xs text-gray-mid mb-6">
        <Link href="/committees" className="hover:text-red no-underline font-bold">
          COMMITTEES
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black font-bold">{committee.chamber.toUpperCase()}</span>
      </nav>

      {/* Header */}
      <div className="border-3 border-border bg-surface p-6 md:p-8 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 font-mono text-xs font-bold text-white ${chamberColor}`}>
            {committee.chamber.toUpperCase()}
          </span>
          <span className="font-mono text-xs text-gray-mid font-bold">
            {committee.systemCode}
          </span>
        </div>
        <h1 className="font-headline text-4xl md:text-5xl mb-4">
          {committee.name}
        </h1>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-4 font-mono text-sm">
          <div className="border-2 border-border px-3 py-1.5 bg-cream-dark">
            <span className="text-gray-mid">Members: </span>
            <span className="font-bold">{committee.members.length}</span>
          </div>
          <div className="border-2 border-border px-3 py-1.5 bg-cream-dark">
            <span className="text-gray-mid">Subcommittees: </span>
            <span className="font-bold">{committee.subcommittees.length}</span>
          </div>
          <div className="border-2 border-border px-3 py-1.5 bg-cream-dark">
            <span className="text-blue-900">D: {dems.length}</span>
            <span className="mx-2 text-gray-mid">|</span>
            <span className="text-red">R: {reps.length}</span>
            {inds.length > 0 && (
              <>
                <span className="mx-2 text-gray-mid">|</span>
                <span className="text-gray-mid">I: {inds.length}</span>
              </>
            )}
          </div>
        </div>

        {/* External links */}
        <div className="mt-4 flex flex-wrap gap-3">
          {committee.websiteUrl && (
            <a
              href={committee.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white font-mono text-xs font-bold hover:bg-red transition-colors no-underline"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              OFFICIAL WEBSITE
            </a>
          )}
          <a
            href={committee.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-border font-mono text-xs font-bold text-gray-dark hover:border-black hover:text-black transition-colors no-underline"
          >
            VIEW ON CONGRESS.GOV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members */}
          <section className="border-3 border-border bg-surface p-6">
            <h2 className="font-headline text-2xl mb-4">Committee Members</h2>

            {committee.members.length === 0 ? (
              <p className="font-body text-sm text-gray-mid">
                Member data is being loaded from Congress.gov. Committee membership
                is cross-referenced with our member directory.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {committee.members.map((m) => (
                  <Link
                    key={m.bioguideId}
                    href={`/directory/${m.slug || m.bioguideId}`}
                    className="no-underline group flex items-center gap-3 p-3 border-2 border-border-light hover:border-red transition-colors"
                  >
                    <div
                      className={`w-10 h-10 flex items-center justify-center text-white font-mono font-bold text-sm shrink-0 ${
                        m.party === "D" ? "bg-blue-900" : m.party === "R" ? "bg-red" : "bg-gray-mid"
                      }`}
                    >
                      {m.party}
                    </div>
                    <div className="min-w-0">
                      <div className="font-headline text-base normal-case group-hover:text-red transition-colors truncate">
                        {m.name}
                      </div>
                      <div className="font-mono text-[10px] text-gray-mid font-bold uppercase">
                        {m.role}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Hearings */}
          {committee.recentHearings.length > 0 && (
            <section className="border-3 border-border bg-surface p-6">
              <h2 className="font-headline text-2xl mb-4">Recent Hearings</h2>
              <div className="space-y-3">
                {committee.recentHearings.map((h, i) => (
                  <div key={i} className="border-2 border-border-light p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-mid">
                        {h.date ? new Date(h.date).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <h3 className="font-headline text-lg normal-case mb-1">
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:text-red transition-colors"
                      >
                        {h.title}
                      </a>
                    </h3>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-6">
          {/* Party breakdown */}
          <section className="border-3 border-border bg-surface p-5">
            <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">PARTY BREAKDOWN</h3>
            <div className="space-y-2">
              {dems.length > 0 && (
                <div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="font-bold text-blue-900">Democrats</span>
                    <span className="font-bold">{dems.length}</span>
                  </div>
                  <div className="h-3 bg-cream-dark border border-border">
                    <div
                      className="h-full bg-blue-900"
                      style={{ width: `${(dems.length / committee.members.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {reps.length > 0 && (
                <div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="font-bold text-red">Republicans</span>
                    <span className="font-bold">{reps.length}</span>
                  </div>
                  <div className="h-3 bg-cream-dark border border-border">
                    <div
                      className="h-full bg-red"
                      style={{ width: `${(reps.length / committee.members.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {inds.length > 0 && (
                <div>
                  <div className="flex justify-between font-mono text-xs mb-1">
                    <span className="font-bold text-gray-mid">Independent</span>
                    <span className="font-bold">{inds.length}</span>
                  </div>
                  <div className="h-3 bg-cream-dark border border-border">
                    <div
                      className="h-full bg-gray-mid"
                      style={{ width: `${(inds.length / committee.members.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Subcommittees */}
          {committee.subcommittees.length > 0 && (
            <section className="border-3 border-border bg-surface p-5">
              <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">
                SUBCOMMITTEES ({committee.subcommittees.length})
              </h3>
              <div className="space-y-2">
                {committee.subcommittees.map((sc) => (
                  <div
                    key={sc.systemCode}
                    className="p-3 border-2 border-border-light bg-cream-dark"
                  >
                    <div className="font-body text-sm font-bold">{sc.name}</div>
                    <div className="font-mono text-[10px] text-gray-mid mt-0.5">
                      {sc.systemCode}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Take Action — Write to a Committee Member */}
          <section className="border-3 border-border bg-cream-dark p-5">
            <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">TAKE ACTION</h3>
            <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
              If legislation you care about is assigned to this committee, contact
              the members directly. Committee members have the most influence over
              whether a bill moves forward or dies.
            </p>
            {committee.members.length > 0 ? (
              <div className="space-y-2">
                <p className="font-mono text-xs font-bold text-gray-dark mb-2">
                  CHOOSE A MEMBER TO WRITE TO:
                </p>
                <div className="flex flex-wrap gap-2">
                  {committee.members.slice(0, 12).map((m) => (
                    <Link
                      key={m.bioguideId}
                      href={`/draft?rep=${encodeURIComponent(m.name)}&issue=${encodeURIComponent(`${committee.name} — I'm writing to you as a member of the ${committee.name}. This committee oversees critical issues that affect my community.`)}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 font-mono text-xs font-bold no-underline transition-colors ${
                        m.party === "D"
                          ? "border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white"
                          : m.party === "R"
                            ? "border-red text-red hover:bg-red hover:text-white"
                            : "border-gray-mid text-gray-mid hover:bg-gray-mid hover:text-white"
                      }`}
                    >
                      <span className={`w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${
                        m.party === "D" ? "bg-blue-900" : m.party === "R" ? "bg-red" : "bg-gray-mid"
                      }`}>
                        {m.party}
                      </span>
                      {m.name}
                      {m.role === "Chair" || m.role === "Ranking Member" ? ` (${m.role})` : ""}
                    </Link>
                  ))}
                </div>
                {committee.members.length > 12 && (
                  <p className="font-mono text-[10px] text-gray-mid mt-1">
                    + {committee.members.length - 12} more members — view full list above
                  </p>
                )}
              </div>
            ) : (
              <Link
                href={`/draft?issue=${encodeURIComponent(`${committee.name} — I'm writing regarding matters before the ${committee.name}.`)}`}
                className="inline-block px-4 py-2 bg-red text-white font-mono text-xs font-bold no-underline hover:bg-black transition-colors"
              >
                WRITE TO THE COMMITTEE
              </Link>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
