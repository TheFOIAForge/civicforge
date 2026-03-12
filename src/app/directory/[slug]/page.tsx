"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { Representative } from "@/data/types";

function partyColor(party: string) {
  if (party === "D") return "bg-dem text-white";
  if (party === "R") return "bg-rep text-white";
  return "bg-ind text-white";
}

function partyBg(party: string) {
  if (party === "D") return "bg-dem";
  if (party === "R") return "bg-rep";
  return "bg-ind";
}

function partyLabel(party: string) {
  if (party === "D") return "Democrat";
  if (party === "R") return "Republican";
  return "Independent";
}

export default function RepProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [rep, setRep] = useState<Representative | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [activeCycle, setActiveCycle] = useState<number | "all">("all");
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    setHasApiKey(!!localStorage.getItem("civicforge_api_key"));
  }, []);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((members: Representative[]) => {
        const match = members.find((m) => m.slug === slug);
        if (match) {
          setRep(match);
          fetch(`/api/members/${match.id}`)
            .then((r) => r.json())
            .then((enriched) => setRep(enriched))
            .catch(() => {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="font-headline text-3xl animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!rep) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="font-headline text-5xl">Member Not Found</h1>
        <p className="mt-4 font-body text-lg text-gray-mid">
          This profile may not be available yet.
        </p>
        <Link
          href="/directory"
          className="inline-block mt-6 px-8 py-4 bg-black text-white font-headline uppercase text-base no-underline hover:bg-red transition-colors"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  const maxVotes = Math.max(
    ...rep.votingRecord.map((v) => v.yea + v.nay),
    1
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link href="/directory" className="font-mono text-sm text-gray-mid hover:text-red no-underline font-bold">
        &larr; BACK TO DIRECTORY
      </Link>

      {/* Header - colored by party */}
      <div className={`mt-4 ${partyBg(rep.party)} p-8 border-3 border-border`}>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Photo / Avatar */}
          <div className="w-32 h-32 bg-black/20 flex items-center justify-center shrink-0 border-3 border-black/30 overflow-hidden">
            {!imgError ? (
              <Image
                src={`https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/225x275/${rep.id}.jpg`}
                alt={rep.fullName}
                width={128}
                height={128}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="font-headline text-5xl text-white">
                {rep.firstName[0]}{rep.lastName[0]}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 text-sm font-mono font-bold bg-white/20 text-white">
                {partyLabel(rep.party)}
              </span>
              {rep.isLeadership && (
                <span className="px-3 py-1 text-sm font-mono font-bold bg-white/30 text-white">
                  &#9733; Leadership
                </span>
              )}
              {!rep.inOffice && (
                <span className="px-3 py-1 text-sm font-mono font-bold bg-black/30 text-white">
                  Former Member
                </span>
              )}
            </div>
            <h1 className="font-headline text-5xl md:text-6xl mt-3 normal-case text-white">
              {rep.fullName}
            </h1>
            <p className="font-mono text-base text-white/90 mt-2 font-bold">
              {rep.title} — {rep.state}
              {rep.district ? `, ${rep.district} District` : ""} |{" "}
              {rep.chamber}
            </p>
            {rep.leadershipRole && (
              <p className="font-mono text-base text-white/90 mt-1 font-bold">{rep.leadershipRole}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats band */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-0 border-x-3 border-b-3 border-border">
        {[
          { label: "Party Loyalty", value: rep.partyLoyalty ? `${rep.partyLoyalty}%` : "—" },
          { label: "Votes Cast", value: rep.votesCast ? rep.votesCast.toLocaleString() : "—" },
          { label: "Missed Votes", value: rep.missedVotes ? rep.missedVotes.toLocaleString() : "—" },
          { label: "Bills Introduced", value: rep.billsIntroduced ? rep.billsIntroduced.toLocaleString() : "—" },
          { label: "Bills Enacted", value: rep.billsEnacted ? rep.billsEnacted.toLocaleString() : "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface p-4 text-center border-r-2 border-b-2 border-border-light last:border-r-0"
          >
            <div className="font-headline text-2xl text-black">{stat.value}</div>
            <div className="font-mono text-xs text-gray-mid mt-1 font-bold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/draft?rep=${rep.slug}&mode=letter`}
          className="px-6 py-3 bg-red text-white font-headline uppercase text-base no-underline hover:bg-red-dark transition-colors border-3 border-red hover:border-red-dark"
        >
          &#9993; Write a Letter
        </Link>
        <Link
          href={`/draft?rep=${rep.slug}&mode=call`}
          className="px-6 py-3 bg-black text-white font-headline uppercase text-base no-underline hover:bg-gray-dark transition-colors border-3 border-black hover:border-gray-dark"
        >
          &#128222; Call Script
        </Link>
        <Link
          href={`/draft?rep=${rep.slug}&mode=social`}
          className="px-6 py-3 bg-black text-white font-headline uppercase text-base no-underline hover:bg-gray-dark transition-colors border-3 border-black hover:border-gray-dark"
        >
          &#128241; Social Post
        </Link>
        {rep.offices[0] && (
          <a
            href={`tel:${rep.offices[0].phone}`}
            className="px-6 py-3 bg-black text-white font-headline uppercase text-base no-underline hover:bg-gray-dark transition-colors border-3 border-black hover:border-gray-dark"
          >
            &#128222; {rep.offices[0].phone}
          </a>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Contact + Bio */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <section className="border-3 border-border p-6 bg-surface">
            <h2 className="font-headline text-2xl mb-5">&#128203; Contact Information</h2>

            {rep.offices.map((office, i) => (
              <div key={i} className="mb-5 pb-5 border-b-2 border-border-light last:border-0 last:mb-0 last:pb-0">
                <h3 className="font-mono text-sm text-gray-mid font-bold mb-2">{office.label.toUpperCase()}</h3>
                <p className="font-body text-base">{office.street}</p>
                <p className="font-body text-base">{office.city}, {office.state} {office.zip}</p>
                <a href={`tel:${office.phone}`} className="font-mono text-base text-red no-underline hover:underline font-bold">
                  {office.phone}
                </a>
              </div>
            ))}

            {/* Web + Forms */}
            <div className="mt-5 pt-5 border-t-2 border-border-light space-y-3">
              {rep.website && (
                <div>
                  <span className="font-mono text-sm text-gray-mid font-bold">WEBSITE: </span>
                  <a href={rep.website} target="_blank" rel="noopener noreferrer" className="font-mono text-base">
                    {rep.website.replace("https://", "")}
                  </a>
                </div>
              )}
              {rep.contactForm && (
                <div>
                  <span className="font-mono text-sm text-gray-mid font-bold">CONTACT FORM: </span>
                  <a href={rep.contactForm} target="_blank" rel="noopener noreferrer" className="font-mono text-base">
                    Send a message &rarr;
                  </a>
                </div>
              )}
            </div>

            {/* Social Media */}
            <div className="mt-5 pt-5 border-t-2 border-border-light">
              <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">SOCIAL MEDIA</h3>
              <div className="flex flex-wrap gap-2">
                {rep.social.twitter && (
                  <a href={`https://twitter.com/${rep.social.twitter}`} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 border-2 border-border font-mono text-sm no-underline text-black hover:bg-red hover:text-white hover:border-red transition-colors font-bold">
                    &#120143; @{rep.social.twitter}
                  </a>
                )}
                {rep.social.facebook && (
                  <a href={`https://facebook.com/${rep.social.facebook}`} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 border-2 border-border font-mono text-sm no-underline text-black hover:bg-red hover:text-white hover:border-red transition-colors font-bold">
                    FB: {rep.social.facebook}
                  </a>
                )}
                {rep.social.instagram && (
                  <a href={`https://instagram.com/${rep.social.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 border-2 border-border font-mono text-sm no-underline text-black hover:bg-red hover:text-white hover:border-red transition-colors font-bold">
                    IG: @{rep.social.instagram}
                  </a>
                )}
                {rep.social.youtube && (
                  <a href={`https://youtube.com/${rep.social.youtube}`} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 border-2 border-border font-mono text-sm no-underline text-black hover:bg-red hover:text-white hover:border-red transition-colors font-bold">
                    YT: {rep.social.youtube}
                  </a>
                )}
                {rep.social.tiktok && (
                  <a href={`https://tiktok.com/@${rep.social.tiktok}`} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 border-2 border-border font-mono text-sm no-underline text-black hover:bg-red hover:text-white hover:border-red transition-colors font-bold">
                    TikTok: @{rep.social.tiktok}
                  </a>
                )}
              </div>
            </div>

            {/* Staff */}
            {rep.staff.length > 0 && (
              <div className="mt-5 pt-5 border-t-2 border-border-light">
                <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">KEY STAFF</h3>
                {rep.staff.map((s, i) => (
                  <div key={i} className="font-body text-base mb-1">
                    <span className="font-bold">{s.name}</span> — {s.title}
                  </div>
                ))}
              </div>
            )}

            {/* Committees */}
            {rep.committees.length > 0 && (
              <div className="mt-5 pt-5 border-t-2 border-border-light">
                <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">COMMITTEES</h3>
                <div className="flex flex-wrap gap-2">
                  {rep.committees.map((c, i) => (
                    <span key={i} className="px-3 py-2 border-2 border-border-light font-mono text-sm bg-cream-dark text-gray-dark font-bold">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Biography */}
          <section className="border-3 border-border p-6 bg-surface">
            <h2 className="font-headline text-2xl mb-4">&#128214; Biography</h2>
            <p className="font-body text-base leading-relaxed">{rep.bio}</p>
          </section>

          {/* Notable Legislation */}
          {rep.notableLegislation.length > 0 && (
            <section className="border-3 border-border p-6 bg-surface">
              <h2 className="font-headline text-2xl mb-5">&#9878;&#65039; Notable Legislation</h2>
              {rep.notableLegislation.filter(bill => bill.title?.trim()).map((bill, i) => (
                <div key={i} className="mb-5 pb-5 border-b-2 border-border-light last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {bill.billNumber?.trim() && (
                      bill.url ? (
                        <a href={bill.url} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-red no-underline hover:underline font-bold">
                          {bill.billNumber}
                        </a>
                      ) : (
                        <span className="font-mono text-sm text-gray-mid font-bold">{bill.billNumber}</span>
                      )
                    )}
                    {bill.year > 0 && (
                      <span className="font-mono text-sm text-gray-mid">{bill.year}</span>
                    )}
                    <span className="px-2 py-1 font-mono text-xs bg-cream-dark text-gray-dark border-2 border-border-light font-bold">
                      {bill.role}
                    </span>
                  </div>
                  <h3 className="font-headline text-lg normal-case">
                    {bill.url ? (
                      <a href={bill.url} target="_blank" rel="noopener noreferrer" className="text-black no-underline hover:text-red">
                        {bill.title}
                      </a>
                    ) : (
                      bill.title
                    )}
                  </h3>
                  {bill.description && (
                    <p className="font-body text-base text-gray-mid mt-1">{bill.description}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Controversies */}
          {rep.controversies.length > 0 && (
            <section className="border-3 border-status-red p-6 bg-status-red-light">
              <h2 className="font-headline text-2xl mb-5">&#128293; Controversies &amp; Key Disputes</h2>
              {rep.controversies.map((c, i) => (
                <div key={i} className="mb-5 pb-5 border-b-2 border-status-red/20 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 font-mono text-xs bg-status-red text-white font-bold">{c.year}</span>
                  </div>
                  <h3 className="font-headline text-lg normal-case">{c.title}</h3>
                  <p className="font-body text-base text-gray-mid mt-1">{c.description}</p>
                </div>
              ))}
            </section>
          )}

          {/* Voting Record */}
          {rep.votingRecord.length > 0 && (
            <section className="border-3 border-border p-6 bg-surface">
              <h2 className="font-headline text-2xl mb-5">&#128202; Voting Record by Issue</h2>
              <div className="space-y-4">
                {rep.votingRecord.map((v) => {
                  const total = v.yea + v.nay;
                  const yeaPct = total > 0 ? (v.yea / maxVotes) * 100 : 0;
                  const nayPct = total > 0 ? (v.nay / maxVotes) * 100 : 0;
                  return (
                    <div key={v.category}>
                      <div className="flex justify-between mb-2">
                        <span className="font-mono text-sm font-bold">{v.category}</span>
                        <span className="font-mono text-sm text-gray-mid">
                          {v.yea} YEA / {v.nay} NAY
                        </span>
                      </div>
                      <div className="flex h-6 bg-cream-dark border-2 border-border">
                        <div
                          className="bg-green h-full"
                          style={{ width: `${yeaPct}%` }}
                        />
                        <div
                          className="bg-status-red h-full"
                          style={{ width: `${nayPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-6 font-mono text-sm text-gray-mid">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green inline-block border-2 border-border" /> YEA
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-status-red inline-block border-2 border-border" /> NAY
                </span>
              </div>
            </section>
          )}

          {/* Key Votes */}
          {rep.keyVotes.length > 0 && (
            <section className="border-3 border-border p-6 bg-surface">
              <h2 className="font-headline text-2xl mb-5">&#128499;&#65039; Key Votes</h2>
              {rep.keyVotes.map((kv, i) => (
                <div key={i} className="mb-4 pb-4 border-b-2 border-border-light last:border-0 last:mb-0 last:pb-0 flex items-center gap-4">
                  <span className={`px-3 py-2 font-mono text-sm font-bold ${kv.vote === "YEA" ? "bg-green text-white" : kv.vote === "NAY" ? "bg-status-red text-white" : "bg-gray-mid text-white"}`}>
                    {kv.vote}
                  </span>
                  <div>
                    <span className="font-mono text-sm text-gray-mid">{kv.bill} — {kv.date}</span>
                    <div className="font-body text-base font-bold">{kv.title}</div>
                  </div>
                  {kv.brokeWithParty && (
                    <span className="px-3 py-1 font-mono text-xs bg-yellow-light text-yellow font-bold">
                      &#9888; Broke with party
                    </span>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right column: Money + Links */}
        <div className="space-y-6">
          {/* Follow the Money */}
          <section className="border-3 border-border p-6 bg-cream-dark">
            <h2 className="font-headline text-2xl mb-4">&#128176; Follow the Money</h2>

            {/* Cycle tabs */}
            {(rep.financeCycles || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-5">
                {(rep.financeCycles || []).map((cf) => (
                  <button
                    key={cf.cycle}
                    onClick={() => setActiveCycle(cf.cycle)}
                    className={`px-3 py-1.5 font-mono text-xs font-bold border-2 cursor-pointer transition-colors ${
                      activeCycle === cf.cycle
                        ? "bg-red text-white border-red"
                        : "bg-surface text-black border-border hover:bg-hover"
                    }`}
                  >
                    {cf.cycle === "all" ? "All Time" : cf.cycle}
                  </button>
                ))}
              </div>
            )}

            {/* Totals for selected cycle */}
            {(() => {
              const cycle = (rep.financeCycles || []).find((c) => c.cycle === activeCycle) || {
                totalFundraising: rep.totalFundraising,
                smallDollarPct: rep.smallDollarPct,
                outsideSpending: (rep.outsideSpending || []),
              };
              return (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-surface border-2 border-border p-4 text-center">
                      <div className="font-headline text-2xl text-black">{cycle.totalFundraising}</div>
                      <div className="font-mono text-xs text-gray-mid font-bold mt-1">Total Raised</div>
                    </div>
                    <div className="bg-surface border-2 border-border p-4 text-center">
                      <div className="font-headline text-2xl text-black">{cycle.smallDollarPct}%</div>
                      <div className="font-mono text-xs text-gray-mid font-bold mt-1">Small Dollar</div>
                    </div>
                  </div>

                  {cycle.outsideSpending.length > 0 && (
                    <div className="mb-5">
                      <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">OUTSIDE SPENDING (SUPER PACs)</h3>
                      {cycle.outsideSpending.map((d, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b-2 border-border-light last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 text-xs font-mono font-bold ${d.support ? 'bg-green-700 text-white' : 'bg-status-red text-white'}`}>
                              {d.support ? 'FOR' : 'AGAINST'}
                            </span>
                            <span className="font-body text-base">{d.name}</span>
                          </div>
                          <span className="font-mono text-sm text-gray-mid font-bold shrink-0 ml-2">{d.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {rep.topDonors.length > 0 && (
              <div className="mb-5">
                <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">TOP DONOR EMPLOYERS</h3>
                {rep.topDonors.map((d, i) => (
                  <div key={i} className="flex justify-between py-2 border-b-2 border-border-light last:border-0">
                    <span className="font-body text-base">{d.name}</span>
                    <span className="font-mono text-sm text-gray-mid font-bold">{d.amount}</span>
                  </div>
                ))}
              </div>
            )}

            {rep.topIndustries.length > 0 && (
              <div className="mb-5">
                <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">DONOR OCCUPATIONS</h3>
                {rep.topIndustries.map((d, i) => (
                  <div key={i} className="flex justify-between py-2 border-b-2 border-border-light last:border-0">
                    <span className="font-body text-base">{d.name}</span>
                    <span className="font-mono text-sm text-gray-mid font-bold">{d.amount}</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI Summary */}
            <div className="mb-5 border-t-2 border-border-light pt-5">
              {aiMessages.length === 0 && !aiLoading && (
                hasApiKey ? (
                  <button
                    onClick={() => {
                      const apiKey = localStorage.getItem("civicforge_api_key");
                      if (!apiKey || !rep) return;
                      setAiLoading(true);

                      const cycleBreakdown = (rep.financeCycles || [])
                        .map((c) => `${c.cycle === "all" ? "All Time" : c.cycle}: ${c.totalFundraising} raised, ${c.smallDollarPct}% small dollar, ${c.outsideSpending.length} outside spenders`)
                        .join("\n");

                      const outsideDetail = (rep.outsideSpending || [])
                        .map((s) => `${s.support ? "FOR" : "AGAINST"}: ${s.name} (${s.amount})`)
                        .join("\n");

                      const donorDetail = rep.topDonors.map((d) => `${d.name}: ${d.amount}`).join(", ");
                      const occDetail = rep.topIndustries.map((d) => `${d.name}: ${d.amount}`).join(", ");

                      const systemPrompt = `You are a nonpartisan campaign finance analyst. Given the following FEC data for ${rep.fullName} (${rep.party === "D" ? "Democrat" : rep.party === "R" ? "Republican" : "Independent"}-${rep.stateAbbr}), explain the key takeaways in plain language.

DATA:
${cycleBreakdown}

OUTSIDE SPENDING (ALL TIME):
${outsideDetail || "None recorded"}

TOP DONOR EMPLOYERS: ${donorDetail || "None"}
DONOR OCCUPATIONS: ${occDetail || "None"}

OpenSecrets profile: ${rep.opensecrets || "N/A"}

RULES:
- Be factual and cite specific dollar amounts
- Explain what the data means for voters (the "so what")
- Note anything unusual (high small-dollar %, heavy opposition spending, etc.)
- Keep it under 300 words
- No partisan framing — present facts and let the reader decide
- Do not use phrases like "let that sink in", "make no mistake", or "imagine"
- Write clearly and directly like a journalist`;

                      fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-api-key": apiKey,
                          "anthropic-version": "2023-06-01",
                          "anthropic-dangerous-direct-browser-access": "true",
                        },
                        body: JSON.stringify({
                          model: "claude-sonnet-4-20250514",
                          max_tokens: 1000,
                          system: systemPrompt,
                          messages: [{ role: "user", content: "Analyze this campaign finance data and give me the key takeaways." }],
                        }),
                      })
                        .then((r) => r.json())
                        .then((data) => {
                          const text = data.content?.[0]?.text || "Unable to generate summary.";
                          setAiMessages([
                            { role: "user", content: "Analyze this campaign finance data and give me the key takeaways." },
                            { role: "assistant", content: text },
                          ]);
                          setAiLoading(false);
                        })
                        .catch(() => {
                          setAiMessages([
                            { role: "user", content: "Analyze this campaign finance data." },
                            { role: "assistant", content: "Failed to generate summary. Please check your API key in Settings." },
                          ]);
                          setAiLoading(false);
                        });
                    }}
                    className="w-full px-4 py-3 bg-black text-white font-mono text-sm text-center cursor-pointer hover:bg-red transition-colors font-bold"
                  >
                    GENERATE AI SUMMARY
                  </button>
                ) : (
                  <Link
                    href="/settings"
                    className="block px-4 py-3 bg-surface text-gray-mid font-mono text-sm text-center no-underline border-2 border-border hover:bg-hover transition-colors font-bold"
                  >
                    SET API KEY IN SETTINGS TO ENABLE AI SUMMARY
                  </Link>
                )
              )}

              {aiLoading && (
                <div className="bg-surface border-2 border-border p-4 text-center">
                  <p className="font-mono text-sm text-gray-mid animate-pulse">Analyzing campaign finance data...</p>
                </div>
              )}

              {aiMessages.length > 0 && !aiLoading && (
                <div className="space-y-3">
                  {aiMessages.filter((m) => m.role === "assistant").map((m, i) => (
                    <div key={i} className="bg-surface border-2 border-border p-4">
                      <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))}

                  {/* Follow-up input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const apiKey = localStorage.getItem("civicforge_api_key");
                      if (!apiKey || !followUp.trim() || aiLoading) return;
                      const newMessages = [...aiMessages, { role: "user", content: followUp.trim() }];
                      setAiMessages(newMessages);
                      setFollowUp("");
                      setAiLoading(true);

                      const cycleBreakdown = (rep.financeCycles || [])
                        .map((c) => `${c.cycle === "all" ? "All Time" : c.cycle}: ${c.totalFundraising} raised, ${c.smallDollarPct}% small dollar`)
                        .join("\n");
                      const outsideDetail = (rep.outsideSpending || []).map((s) => `${s.support ? "FOR" : "AGAINST"}: ${s.name} (${s.amount})`).join("\n");
                      const systemPrompt = `You are a nonpartisan campaign finance analyst discussing FEC data for ${rep.fullName} (${rep.party === "D" ? "Democrat" : rep.party === "R" ? "Republican" : "Independent"}-${rep.stateAbbr}). Cycle data:\n${cycleBreakdown}\nOutside spending:\n${outsideDetail || "None"}\nTop employers: ${rep.topDonors.map((d) => `${d.name}: ${d.amount}`).join(", ") || "None"}\nOccupations: ${rep.topIndustries.map((d) => `${d.name}: ${d.amount}`).join(", ") || "None"}\n\nRules: Be factual, cite numbers, no partisan framing, write clearly like a journalist. Keep answers concise.`;

                      fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-api-key": apiKey,
                          "anthropic-version": "2023-06-01",
                          "anthropic-dangerous-direct-browser-access": "true",
                        },
                        body: JSON.stringify({
                          model: "claude-sonnet-4-20250514",
                          max_tokens: 1000,
                          system: systemPrompt,
                          messages: newMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
                        }),
                      })
                        .then((r) => r.json())
                        .then((data) => {
                          const text = data.content?.[0]?.text || "Unable to respond.";
                          setAiMessages([...newMessages, { role: "assistant", content: text }]);
                          setAiLoading(false);
                        })
                        .catch(() => {
                          setAiMessages([...newMessages, { role: "assistant", content: "Failed to respond. Please try again." }]);
                          setAiLoading(false);
                        });
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={followUp}
                      onChange={(e) => setFollowUp(e.target.value)}
                      placeholder="Ask a follow-up question..."
                      className="flex-1 px-3 py-2 border-2 border-border bg-surface font-mono text-sm focus:outline-none focus:border-red"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading || !followUp.trim()}
                      className="px-4 py-2 bg-black text-white font-mono text-sm font-bold cursor-pointer hover:bg-red transition-colors disabled:opacity-50"
                    >
                      ASK
                    </button>
                  </form>
                </div>
              )}
            </div>

            {rep.opensecrets && (
              <a
                href={rep.opensecrets}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 bg-black text-white font-mono text-sm text-center no-underline hover:bg-red transition-colors font-bold"
              >
                FULL PROFILE ON OPENSECRETS &rarr;
              </a>
            )}
          </section>

          {/* Research Links */}
          <section className="border-3 border-border p-6 bg-cream-dark">
            <h2 className="font-headline text-2xl mb-5">&#128279; Research &amp; Links</h2>
            <div className="space-y-2">
              {[
                { label: "Congress.gov", url: rep.congressGov },
                { label: "Bioguide (Congress)", url: rep.bioguide },
                { label: "GovTrack", url: rep.govtrack },
                { label: "VoteSmart", url: rep.votesmart },
                { label: "Ballotpedia", url: rep.ballotpedia },
                { label: "OpenSecrets", url: rep.opensecrets },
              ].filter((link) => link.url).map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 border-2 border-border bg-surface font-mono text-sm no-underline text-black hover:bg-hover transition-colors font-bold"
                >
                  {link.label} &rarr;
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
