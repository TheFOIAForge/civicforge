"use client";

import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { issues } from "@/data/issues";
import type { Representative } from "@/data/types";

function partyBg(party: string) {
  if (party === "D") return "bg-dem";
  if (party === "R") return "bg-rep";
  return "bg-ind";
}

const issueAccent: Record<string, string> = {
  healthcare: "border-l-status-red",
  environment: "border-l-teal",
  housing: "border-l-orange",
  immigration: "border-l-red",
  education: "border-l-purple",
  economy: "border-l-yellow",
  "civil-rights": "border-l-gray-dark",
  defense: "border-l-border",
};

export default function Home() {
  const [address, setAddress] = useState("");
  const [results, setResults] = useState<Representative[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [leadership, setLeadership] = useState<Representative[]>([]);
  const [featured, setFeatured] = useState<Representative[]>([]);

  useEffect(() => {
    fetch("/api/members?leadership=true")
      .then((r) => r.json())
      .then(setLeadership)
      .catch(() => {});
    fetch("/api/members?featured=true")
      .then((r) => r.json())
      .then(setFeatured)
      .catch(() => {});
  }, []);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const input = address.trim();
    if (!input) return;
    setLookupLoading(true);
    fetch(`/api/lookup?address=${encodeURIComponent(input)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.length > 0 ? data : []);
        setLookupLoading(false);
      })
      .catch(() => {
        setResults([]);
        setLookupLoading(false);
      });
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-black text-white px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase leading-none text-white">
            They Work
            <br />
            <span className="text-red">For You.</span>
          </h1>
          <p className="mt-5 text-xl md:text-2xl font-body text-white/80 max-w-2xl mx-auto">
            Find your elected officials. Draft a letter. Make a call. Hold them
            accountable. All in one place.
          </p>

          <form
            onSubmit={handleLookup}
            className="mt-8 flex flex-col sm:flex-row gap-0 max-w-2xl mx-auto"
          >
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your ZIP code or state"
              className="flex-1 px-5 py-4 bg-white text-black border-2 border-white font-mono text-base placeholder:text-gray-light focus:outline-none focus:border-red"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-red text-white font-headline uppercase text-base tracking-wider border-2 border-red hover:bg-red-dark hover:border-red-dark transition-colors cursor-pointer"
            >
              Find My Reps
            </button>
          </form>

        </div>
      </section>

      {/* Lookup results */}
      {lookupLoading && (
        <section className="border-b-3 border-border px-4 py-10 bg-red-light">
          <div className="max-w-6xl mx-auto text-center">
            <p className="font-headline text-2xl animate-pulse">Looking up your representatives...</p>
          </div>
        </section>
      )}
      {results && !lookupLoading && results.length === 0 && (
        <section className="border-b-3 border-border px-4 py-10 bg-red-light">
          <div className="max-w-6xl mx-auto text-center">
            <p className="font-headline text-2xl">No representatives found for that address.</p>
            <p className="font-body text-base mt-2 text-gray-mid">Try entering a full address with ZIP code (e.g., &quot;1600 Pennsylvania Ave, Washington DC 20500&quot;)</p>
          </div>
        </section>
      )}
      {results && !lookupLoading && results.length > 0 && (
        <section className="border-b-3 border-border px-4 py-10 bg-red-light">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-headline text-3xl mb-6">Your Representatives</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.map((rep) => (
                <Link
                  key={rep.id}
                  href={`/directory/${rep.slug}`}
                  className="no-underline text-black border-2 border-border bg-surface p-5 hover:bg-hover transition-colors group"
                >
                  {/* Avatar */}
                  <div className={`w-16 h-16 ${partyBg(rep.party)} flex items-center justify-center mb-3 overflow-hidden relative`}>
                    <span className="font-headline text-2xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                    {rep.photoUrl && (
                      <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs font-mono font-bold ${partyBg(rep.party)} text-white`}>
                    {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                  </span>
                  {rep.leadershipRole && (
                    <span className="inline-block ml-2 px-2 py-1 text-xs font-mono font-bold bg-red text-white">
                      LEADER
                    </span>
                  )}
                  <h3 className="font-headline text-xl mt-2 normal-case group-hover:text-red">{rep.fullName}</h3>
                  <p className="font-mono text-sm text-gray-mid mt-1">
                    {rep.title} — {rep.state}
                    {rep.district ? `, ${rep.district} District` : ""}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Congressional Leadership */}
      <section className="px-4 py-16 border-b-3 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end gap-4 mb-8">
            <h2 className="font-headline text-4xl md:text-5xl">Congressional Leadership</h2>
            <div className="hidden md:block h-1 flex-1 bg-border mb-3" />
          </div>
          <p className="font-mono text-sm text-gray-mid mb-8 -mt-4">
            THE FOUR PEOPLE WHO SET THE AGENDA FOR EVERY AMERICAN
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {leadership.map((rep) => {
              const bgColor = rep.party === "R" ? "bg-rep" : "bg-dem";
              return (
                <Link
                  key={rep.id}
                  href={`/directory/${rep.slug}`}
                  className={`no-underline text-white ${bgColor} p-6 hover:opacity-90 transition-opacity border-3 border-border group`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white/80 text-2xl">&#9733;</span>
                    <span className="font-mono text-sm font-bold text-white/80">
                      {rep.party === "D" ? "DEMOCRAT" : "REPUBLICAN"}
                    </span>
                  </div>
                  {/* Photo */}
                  <div className="w-20 h-20 bg-black/20 flex items-center justify-center mb-4 overflow-hidden relative">
                    <span className="font-headline text-4xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                    {rep.photoUrl && (
                      <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <h3 className="font-headline text-2xl normal-case text-white">{rep.fullName}</h3>
                  <p className="font-mono text-sm text-white/90 mt-2 font-bold">
                    {rep.leadershipRole}
                  </p>
                  <p className="font-mono text-sm text-white/70 mt-1">
                    {rep.state}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Notable Members */}
      <section className="px-4 py-16 border-b-3 border-border bg-cream-dark">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end gap-4 mb-8">
            <h2 className="font-headline text-4xl md:text-5xl">Notable Members</h2>
            <div className="hidden md:block h-1 flex-1 bg-border mb-3" />
          </div>
          <p className="font-mono text-sm text-gray-mid mb-8 -mt-4">
            HIGH-PROFILE LEGISLATORS SHAPING THE NATIONAL DEBATE
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((rep) => (
              <Link
                key={rep.id}
                href={`/directory/${rep.slug}`}
                className="no-underline text-black border-2 border-border bg-surface p-5 hover:bg-hover transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-14 h-14 ${partyBg(rep.party)} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                    <span className="font-headline text-xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                    {rep.photoUrl && (
                      <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-mono font-bold ${partyBg(rep.party)} text-white`}>
                        {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                      </span>
                      <span className="font-mono text-xs text-gray-mid font-bold">{rep.chamber}</span>
                    </div>
                    <h3 className="font-headline text-xl normal-case mt-1 group-hover:text-red">{rep.fullName}</h3>
                  </div>
                </div>
                <p className="font-mono text-sm text-gray-mid">
                  {rep.title} — {rep.state}
                </p>
                {rep.leadershipRole && (
                  <p className="font-mono text-sm text-red font-bold mt-1">{rep.leadershipRole}</p>
                )}
                <div className="mt-3 pt-3 border-t-2 border-border-light flex gap-4">
                  {rep.partyLoyalty > 0 && <span className="font-mono text-xs text-gray-mid">
                    <span className="font-bold">{rep.partyLoyalty}%</span> Party Loyalty
                  </span>}
                  {rep.billsIntroduced > 0 && <span className="font-mono text-xs text-gray-mid">
                    <span className="font-bold">{rep.billsIntroduced}</span> bills
                  </span>}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/directory"
              className="inline-block px-8 py-4 bg-black text-white font-headline uppercase text-base tracking-wider border-3 border-black hover:bg-red hover:border-red transition-colors no-underline"
            >
              Browse All 535 Members
            </Link>
          </div>
        </div>
      </section>

      {/* Issues - white cards with colored left border */}
      <section className="px-4 py-16 border-b-3 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end gap-4 mb-8">
            <h2 className="font-headline text-4xl md:text-5xl">Issues That Matter</h2>
            <div className="hidden md:block h-1 flex-1 bg-border mb-3" />
          </div>
          <p className="font-mono text-sm text-gray-mid mb-8 -mt-4">
            LEARN THE FACTS. FIND YOUR VOICE. TAKE ACTION.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.slug}`}
                className={`no-underline text-black border-2 border-border bg-surface p-5 hover:bg-hover transition-colors border-l-4 ${
                  issueAccent[issue.id] || "border-l-border"
                }`}
              >
                <span className="text-4xl block mb-3">{issue.icon}</span>
                <h3 className="font-headline text-lg normal-case">{issue.name}</h3>
                <p className="font-mono text-xs mt-2 text-gray-mid">
                  {issue.legislation.length} active {issue.legislation.length === 1 ? "bill" : "bills"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-black text-white px-4 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { number: "535", label: "Members of Congress" },
            { number: "100", label: "Senators" },
            { number: "435", label: "Representatives" },
            { number: "50", label: "States Covered" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-headline text-5xl md:text-6xl text-red">
                {stat.number}
              </div>
              <div className="font-mono text-sm text-white/70 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 bg-cta text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-headline text-5xl md:text-6xl text-white">
            Your Voice. Their Vote.
          </h2>
          <p className="mt-6 font-body text-xl text-white/90">
            Every letter, every call, every post adds up. Representatives track
            constituent contacts. Make yours count.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/draft"
              className="px-10 py-4 bg-red text-white font-headline uppercase text-base tracking-wider border-3 border-red hover:bg-red-dark hover:border-red-dark transition-colors no-underline"
            >
              Draft a Letter Now
            </Link>
            <Link
              href="/directory"
              className="px-10 py-4 bg-white text-black font-headline uppercase text-base tracking-wider border-3 border-white hover:bg-cream-dark hover:border-cream-dark transition-colors no-underline"
            >
              Find Your Rep
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
