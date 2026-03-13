"use client";

import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { useMyReps } from "@/lib/my-reps-context";
import type { Representative } from "@/data/types";

function partyBg(party: string) {
  if (party === "D") return "bg-dem";
  if (party === "R") return "bg-rep";
  return "bg-ind";
}

export default function MyRepsPage() {
  const { myReps, removeRep, saveRep, hasSavedReps, clearMyReps } = useMyReps();
  const [address, setAddress] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<Representative[] | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Check for stored address
  const [storedAddress, setStoredAddress] = useState("");
  useEffect(() => {
    const addr = localStorage.getItem("citizenforge_address");
    if (addr) setStoredAddress(addr);
  }, []);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const input = address.trim();
    if (!input) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupResults(null);

    fetch(`/api/lookup?address=${encodeURIComponent(input)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.length > 0) {
          setLookupResults(data);
          // Save the address
          localStorage.setItem("citizenforge_address", input);
          setStoredAddress(input);
        } else {
          setLookupError("No representatives found. Try a full address with ZIP code.");
        }
      })
      .catch(() => {
        setLookupError("Lookup failed. Please check your connection and try again.");
      })
      .finally(() => setLookupLoading(false));
  }

  function handleSaveAll(reps: Representative[]) {
    reps.forEach((rep) => saveRep(rep));
    setLookupResults(null);
    setAddress("");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">My Representatives</h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        SAVE YOUR REPS FOR QUICK ACCESS ACROSS CITIZENFORGE
      </p>

      {/* Saved Reps */}
      {hasSavedReps ? (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-2xl">
              Your Saved Representatives
              <span className="ml-3 px-2 py-1 bg-red text-white font-mono text-xs font-bold align-middle">
                {myReps.length}
              </span>
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href="/draft"
                className="px-4 py-2 bg-red text-white font-mono text-sm font-bold no-underline hover:bg-black transition-colors"
              >
                WRITE TO THEM
              </Link>
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-2 bg-surface text-gray-mid font-mono text-xs font-bold border-2 border-border cursor-pointer hover:border-red hover:text-red transition-colors"
                >
                  CLEAR ALL
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-red font-bold">Sure?</span>
                  <button
                    onClick={() => { clearMyReps(); setShowClearConfirm(false); }}
                    className="px-3 py-1.5 bg-red text-white font-mono text-xs font-bold cursor-pointer"
                  >
                    YES
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 bg-surface text-black font-mono text-xs font-bold border border-border cursor-pointer"
                  >
                    NO
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myReps.map((rep) => (
              <div
                key={rep.id}
                className="border-3 border-border bg-surface p-5 relative group"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeRep(rep.id)}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-surface border border-border text-gray-mid hover:bg-red hover:text-white hover:border-red transition-colors cursor-pointer font-mono text-xs font-bold opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Remove ${rep.fullName}`}
                  title="Remove from My Reps"
                >
                  ✕
                </button>

                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 ${partyBg(rep.party)} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                    <span className="font-headline text-xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                    {rep.photoUrl && (
                      <img src={rep.photoUrl} alt={rep.fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-mono font-bold ${partyBg(rep.party)} text-white`}>
                        {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                      </span>
                      <span className="font-mono text-xs text-gray-mid font-bold">{rep.chamber}</span>
                    </div>
                    <Link href={`/directory/${rep.slug}`} className="no-underline text-black hover:text-red transition-colors">
                      <h3 className="font-headline text-lg normal-case">{rep.fullName}</h3>
                    </Link>
                    <p className="font-mono text-xs text-gray-mid">
                      {rep.title} — {rep.state}{rep.district ? `, ${rep.district}` : ""}
                    </p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex gap-3 mb-4 text-center">
                  {rep.partyLoyalty > 0 && (
                    <div className="flex-1 bg-cream-dark p-2 border border-border-light">
                      <span className="block font-headline text-lg">{rep.partyLoyalty}%</span>
                      <span className="font-mono text-[9px] text-gray-mid font-bold">PARTY LOYAL</span>
                    </div>
                  )}
                  <div className="flex-1 bg-cream-dark p-2 border border-border-light">
                    <span className="block font-headline text-lg">{rep.billsIntroduced}</span>
                    <span className="font-mono text-[9px] text-gray-mid font-bold">BILLS</span>
                  </div>
                  <div className="flex-1 bg-cream-dark p-2 border border-border-light">
                    <span className="block font-headline text-lg">{rep.committees.length}</span>
                    <span className="font-mono text-[9px] text-gray-mid font-bold">COMMITTEES</span>
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/draft?rep=${rep.slug}`}
                    className="flex-1 px-3 py-2.5 bg-red text-white font-mono text-xs font-bold no-underline text-center hover:bg-black transition-colors"
                  >
                    WRITE
                  </Link>
                  <Link
                    href={`/draft?rep=${rep.slug}&mode=call`}
                    className="flex-1 px-3 py-2.5 bg-black text-white font-mono text-xs font-bold no-underline text-center hover:bg-red transition-colors"
                  >
                    CALL SCRIPT
                  </Link>
                  <Link
                    href={`/directory/${rep.slug}`}
                    className="flex-1 px-3 py-2.5 bg-surface text-black font-mono text-xs font-bold no-underline text-center border-2 border-border hover:border-red transition-colors"
                  >
                    PROFILE
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {storedAddress && (
            <p className="mt-4 font-mono text-xs text-gray-mid">
              Based on address: <span className="font-bold">{storedAddress}</span>
            </p>
          )}
        </section>
      ) : (
        /* Empty state */
        <section className="border-3 border-border bg-surface p-8 md:p-12 mb-10 text-center">
          <div className="max-w-lg mx-auto">
            <p className="font-headline text-4xl mb-2">🏛️</p>
            <h2 className="font-headline text-2xl mb-3">No Representatives Saved Yet</h2>
            <p className="font-body text-base text-gray-mid mb-6 leading-relaxed">
              Enter your address below to find and save your elected officials.
              Your saved reps appear across CitizenForge — in the drafting tool,
              vote lookup, and more.
            </p>
          </div>
        </section>
      )}

      {/* Address Lookup */}
      <section className="border-3 border-border bg-surface p-6 md:p-8 mb-8">
        <h2 className="font-headline text-2xl mb-2">
          {hasSavedReps ? "Update Your Representatives" : "Find Your Representatives"}
        </h2>
        <p className="font-body text-sm text-gray-mid mb-5">
          Enter your home address or ZIP code. We use the Google Civic Information API to find
          your exact federal and state representatives.
        </p>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-0 mb-4">
          <label htmlFor="my-reps-address" className="sr-only">Enter your ZIP code or full address</label>
          <input
            id="my-reps-address"
            type="search"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your ZIP code or full address..."
            className="flex-1 px-5 py-4 border-3 border-border bg-cream font-mono text-base placeholder:text-gray-light focus:outline-none focus:border-red"
          />
          <button
            type="submit"
            disabled={lookupLoading}
            className="px-8 py-4 bg-red text-white font-headline uppercase text-base tracking-wider border-3 border-red hover:bg-red-dark hover:border-red-dark transition-colors cursor-pointer disabled:bg-gray-mid disabled:border-gray-mid"
          >
            {lookupLoading ? "Searching..." : "Find My Reps"}
          </button>
        </form>

        {lookupError && (
          <div className="p-4 border-2 border-red bg-red-light font-mono text-sm font-bold text-red" role="alert">
            {lookupError}
          </div>
        )}

        {/* Lookup results */}
        {lookupResults && lookupResults.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-xl">Found {lookupResults.length} Representatives</h3>
              <button
                onClick={() => handleSaveAll(lookupResults)}
                className="px-5 py-2.5 bg-black text-white font-mono text-sm font-bold cursor-pointer hover:bg-red transition-colors"
              >
                SAVE ALL AS MY REPS
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {lookupResults.map((rep) => (
                <div
                  key={rep.id}
                  className="border-2 border-border bg-cream-dark p-4"
                >
                  <div className={`w-12 h-12 ${partyBg(rep.party)} flex items-center justify-center mb-2 overflow-hidden relative`}>
                    <span className="font-headline text-lg text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                    {rep.photoUrl && (
                      <img src={rep.photoUrl} alt={rep.fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <span className={`inline-block px-2 py-0.5 text-xs font-mono font-bold ${partyBg(rep.party)} text-white`}>
                    {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                  </span>
                  <h4 className="font-headline text-lg mt-1 normal-case">{rep.fullName}</h4>
                  <p className="font-mono text-xs text-gray-mid">
                    {rep.title} — {rep.state}{rep.district ? `, ${rep.district}` : ""}
                  </p>
                  <button
                    onClick={() => saveRep(rep)}
                    className="mt-3 w-full px-3 py-2 bg-red text-white font-mono text-xs font-bold cursor-pointer hover:bg-black transition-colors"
                  >
                    SAVE THIS REP
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-3 border-border bg-cream-dark p-6 mb-8">
        <h2 className="font-headline text-xl normal-case mb-3">How Saved Reps Work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="font-headline text-lg text-red shrink-0">1.</span>
            <div>
              <p className="font-body text-sm font-bold">Find &amp; Save</p>
              <p className="font-body text-sm text-gray-mid">
                Look up your address. Save all your federal reps in one click.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-headline text-lg text-red shrink-0">2.</span>
            <div>
              <p className="font-body text-sm font-bold">Personalized Everywhere</p>
              <p className="font-body text-sm text-gray-mid">
                Your reps show up first in drafting, vote lookup, and comparison tools.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-headline text-lg text-red shrink-0">3.</span>
            <div>
              <p className="font-body text-sm font-bold">One-Tap Action</p>
              <p className="font-body text-sm text-gray-mid">
                Write, call, or post about your reps with a single tap from this page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy note */}
      <div className="text-center">
        <p className="font-mono text-xs text-gray-mid">
          Your reps are stored locally in your browser. Nothing is sent to our servers.
        </p>
      </div>
    </div>
  );
}
