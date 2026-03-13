"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { Representative, ContactLogEntry, EmailServiceConfig } from "@/data/types";
import MailLetterModal from "@/components/MailLetterModal";

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
  const [enriching, setEnriching] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [activeCycle, setActiveCycle] = useState<number | "all">("all");
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [lobbyAnalysis, setLobbyAnalysis] = useState("");
  const [lobbyAnalysisLoading, setLobbyAnalysisLoading] = useState(false);
  const [expandedFilings, setExpandedFilings] = useState<Set<number>>(new Set());
  const [latestDraft, setLatestDraft] = useState<ContactLogEntry | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [mailModalOpen, setMailModalOpen] = useState(false);

  useEffect(() => {
    setHasApiKey(!!localStorage.getItem("checkmyrep_api_key"));
    // Load latest draft for this rep from contact log
    const stored = localStorage.getItem("checkmyrep_contacts");
    if (stored) {
      const contacts: ContactLogEntry[] = JSON.parse(stored);
      const repDrafts = contacts.filter((c) => c.repId === slug || c.repName?.toLowerCase().includes(slug.replace(/-/g, " ")));
      if (repDrafts.length > 0) {
        setLatestDraft(repDrafts[repDrafts.length - 1]);
      }
    }
  }, [slug]);

  useEffect(() => {
    setEnriching(true);
    fetch("/api/members")
      .then((r) => r.json())
      .then((members: Representative[]) => {
        const match = members.find((m) => m.slug === slug);
        if (match) {
          setRep(match);
          fetch(`/api/members/${match.id}`)
            .then((r) => r.json())
            .then((enriched) => { setRep(enriched); setEnriching(false); })
            .catch(() => setEnriching(false));
        } else {
          setEnriching(false);
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); setEnriching(false); });
  }, [slug]);

  function openMailto() {
    if (!rep) return;
    const to = rep.email || "";
    const subject = latestDraft ? `Re: ${latestDraft.issue}` : `Message for ${rep.fullName}`;
    const body = latestDraft?.content || "";
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_self");
  }

  async function sendDirectEmail() {
    if (!rep || !latestDraft?.content) return;
    const configStr = localStorage.getItem("checkmyrep_email_config");
    if (!configStr) return;
    const config: EmailServiceConfig = JSON.parse(configStr);
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: rep.email || "",
          subject: `Re: ${latestDraft.issue}`,
          body: latestDraft.content,
          provider: config.provider,
          apiKey: config.apiKey,
          from: config.senderEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailResult({ ok: true, message: "Email sent successfully." });
      } else {
        setEmailResult({ ok: false, message: data.error || "Failed to send email." });
      }
    } catch (err) {
      setEmailResult({ ok: false, message: err instanceof Error ? err.message : "Network error." });
    } finally {
      setEmailSending(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="font-headline text-3xl motion-safe:animate-pulse">Loading profile...</p>
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

  // ── Follow the Money: Connections ──
  // Cross-reference lobbying filings, donors, and votes
  type MoneyConnection = {
    type: "lobby-vote" | "donor-lobby";
    entity: string;
    amount?: string;
    bill?: string;
    billTitle?: string;
    vote?: "YEA" | "NAY" | "ABSTAIN";
    lobbyClient?: string;
    matchedBillCount?: number;
    matchedBills?: Array<{ bill: string; title: string; vote: "YEA" | "NAY" | "ABSTAIN" }>;
  };

  const moneyConnections: MoneyConnection[] = [];

  if (!enriching && rep.lobbyingFilings && rep.keyVotes) {
    const voteLookup = new Map<string, { title: string; vote: "YEA" | "NAY" | "ABSTAIN" }>();
    for (const kv of rep.keyVotes) {
      // Normalize bill number: "H.R. 1234" -> "hr1234", "S. 456" -> "s456"
      const normalized = kv.bill.replace(/[\s.]/g, "").toLowerCase();
      voteLookup.set(normalized, { title: kv.title, vote: kv.vote });
    }

    // 1) Lobbying filing bills matched against key votes
    for (const filing of rep.lobbyingFilings) {
      for (const billNum of filing.billsLobbied || []) {
        const normalizedBill = billNum.replace(/[\s.]/g, "").toLowerCase();
        const matchedVote = voteLookup.get(normalizedBill);
        if (matchedVote) {
          moneyConnections.push({
            type: "lobby-vote",
            entity: filing.client,
            amount: filing.amount > 0 ? `$${filing.amount.toLocaleString()}` : undefined,
            bill: billNum,
            billTitle: matchedVote.title,
            vote: matchedVote.vote,
          });
        }
      }
    }

    // 2) Top donors whose names fuzzy-match lobbying clients
    for (const donor of rep.topDonors) {
      const donorLower = donor.name.toLowerCase();
      const matchingFilings = rep.lobbyingFilings.filter((f) => {
        const clientLower = f.client.toLowerCase();
        return (
          clientLower.includes(donorLower) ||
          donorLower.includes(clientLower) ||
          // Match on significant substrings (3+ word orgs)
          donorLower.split(/\s+/).filter((w) => w.length > 3).some((w) => clientLower.includes(w) && clientLower.length < donorLower.length * 2)
        );
      });

      if (matchingFilings.length > 0) {
        // Find bills from these filings that the member voted on
        const matchedBills: Array<{ bill: string; title: string; vote: "YEA" | "NAY" | "ABSTAIN" }> = [];
        for (const f of matchingFilings) {
          for (const billNum of f.billsLobbied || []) {
            const normalizedBill = billNum.replace(/[\s.]/g, "").toLowerCase();
            const matchedVote = voteLookup.get(normalizedBill);
            if (matchedVote) {
              matchedBills.push({ bill: billNum, title: matchedVote.title, vote: matchedVote.vote });
            }
          }
        }

        moneyConnections.push({
          type: "donor-lobby",
          entity: donor.name,
          amount: donor.amount,
          lobbyClient: matchingFilings[0].client,
          matchedBillCount: matchedBills.length,
          matchedBills: matchedBills.length > 0 ? matchedBills : undefined,
        });
      }
    }
  }

  // Deduplicate connections by entity+bill
  const seenKeys = new Set<string>();
  const uniqueConnections = moneyConnections.filter((c) => {
    const key = `${c.type}-${c.entity}-${c.bill || ""}-${c.lobbyClient || ""}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

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

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2 mb-5">
              {rep.contactForm && (
                <a
                  href={rep.contactForm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-red text-white font-headline uppercase text-sm no-underline hover:bg-red-dark transition-colors border-3 border-red hover:border-red-dark"
                >
                  Open Contact Form &#8594;
                </a>
              )}
              <button
                onClick={openMailto}
                className="px-5 py-3 bg-black text-white font-headline uppercase text-sm cursor-pointer hover:bg-gray-dark transition-colors border-3 border-black hover:border-gray-dark"
              >
                &#9993; Send Email
              </button>
            </div>

            {rep.offices.map((office, i) => (
              <div key={i} className="mb-5 pb-5 border-b-2 border-border-light last:border-0 last:mb-0 last:pb-0">
                <h3 className="font-mono text-sm text-gray-mid font-bold mb-2">{office.label.toUpperCase()}</h3>
                <p className="font-body text-base">{office.street}</p>
                <p className="font-body text-base">{office.city}, {office.state} {office.zip}</p>
                <a
                  href={`tel:${office.phone}`}
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 border-2 border-border font-mono text-sm text-black no-underline hover:bg-red hover:text-white hover:border-red transition-colors font-bold"
                >
                  &#128222; Call {office.phone}
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
                    <Link
                      key={i}
                      href={`/committees/${c.toLowerCase().replace(/['']/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                      className="px-3 py-2 border-2 border-border-light font-mono text-sm bg-cream-dark text-gray-dark font-bold no-underline hover:bg-red hover:text-white hover:border-red transition-colors"
                    >
                      {c}
                    </Link>
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

          {/* Deep Data Loading Skeleton */}
          {enriching && (
            <section className="border-3 border-border p-6 bg-surface motion-safe:animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 border-2 border-border border-t-red animate-spin" style={{ borderRadius: '50%', animationDuration: '1s' }} />
                <span className="font-mono text-sm text-gray-mid font-bold">LOADING LOBBYING, HEARINGS &amp; SPENDING DATA&hellip;</span>
              </div>
              <div className="space-y-3">
                {[1,2,3].map(n => (
                  <div key={n} className="border-b border-border-light pb-3">
                    <div className="h-4 bg-border/30 w-48 mb-2" />
                    <div className="h-3 bg-border/20 w-64" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Lobbying Activity */}
          {!enriching && (rep.lobbyingFilings || []).length > 0 && (
            <section className="border-3 border-border p-6 bg-surface">
              <h2 className="font-headline text-2xl mb-5">&#127970; Lobbying Activity</h2>
              <p className="font-body text-sm text-gray-mid mb-4">
                Lobbying filings that reference this member or their legislation. Source: Senate LDA.
              </p>

              {/* AI Analysis button */}
              {hasApiKey && !lobbyAnalysis && !lobbyAnalysisLoading && (
                <button
                  onClick={() => {
                    const apiKey = localStorage.getItem("checkmyrep_api_key");
                    if (!apiKey || !rep?.lobbyingFilings) return;
                    setLobbyAnalysisLoading(true);
                    const filingsSummary = rep.lobbyingFilings.map((f) =>
                      `Client: ${f.client}${f.clientDescription ? ` (${f.clientDescription})` : ""} | Firm: ${f.registrant} | $${f.amount.toLocaleString()} (${f.filingYear}) | Issues: ${f.issueLabels?.join(", ") || f.issueCodes.join(", ") || "N/A"} | Lobbying on: ${f.specificIssues[0]?.slice(0, 300) || "N/A"} | Bills: ${f.billsLobbied?.join(", ") || "None"} | Donor match: ${f.matchesDonor ? "YES" : "no"}`
                    ).join("\n\n");
                    fetch("https://api.anthropic.com/v1/messages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
                      body: JSON.stringify({
                        model: "claude-sonnet-4-20250514",
                        max_tokens: 1200,
                        system: `You are an investigative journalist analyzing lobbying filings for ${rep.fullName} (${rep.party === "D" ? "Democrat" : rep.party === "R" ? "Republican" : "Independent"}-${rep.stateAbbr}, ${rep.title}). Committees: ${rep.committees.join(", ")}.\n\nRules:\n- Identify the key industries and interests lobbying this member\n- Flag any donor-lobbyist overlaps (marked "Donor match: YES")\n- Explain what the lobbying activity tells us about who wants this member's attention and why\n- Note any patterns (same lobbying firm representing multiple clients, concentration in one sector)\n- Be factual, cite specific dollar amounts and client names\n- Keep it under 250 words\n- No partisan framing — present facts\n- Do not use phrases like "let that sink in" or "make no mistake"`,
                        messages: [{ role: "user", content: `Analyze these ${rep.lobbyingFilings.length} lobbying filings:\n\n${filingsSummary}` }],
                      }),
                    })
                      .then((r) => r.json())
                      .then((data) => { setLobbyAnalysis(data.content?.[0]?.text || "Unable to analyze."); setLobbyAnalysisLoading(false); })
                      .catch(() => { setLobbyAnalysis("Failed to generate analysis. Check your API key."); setLobbyAnalysisLoading(false); });
                  }}
                  className="w-full mb-4 px-4 py-3 bg-black text-white font-mono text-sm text-center cursor-pointer hover:bg-red transition-colors font-bold flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  ANALYZE ALL LOBBYING ACTIVITY WITH AI
                </button>
              )}
              {lobbyAnalysisLoading && (
                <div className="mb-4 bg-surface border-2 border-border p-4 text-center">
                  <p className="font-mono text-sm text-gray-mid motion-safe:animate-pulse">Analyzing lobbying patterns...</p>
                </div>
              )}
              {lobbyAnalysis && (
                <div className="mb-5 bg-surface border-2 border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 bg-red text-white text-[10px] font-mono font-bold">AI</span>
                    <span className="font-mono text-xs text-gray-mid font-bold">LOBBYING ANALYSIS</span>
                  </div>
                  <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{lobbyAnalysis}</p>
                </div>
              )}

              {rep.lobbyingFilings!.map((filing, i) => {
                const isExpanded = expandedFilings.has(i);
                return (
                <div key={i} className={`mb-4 pb-4 border-b-2 border-border-light last:border-0 last:mb-0 last:pb-0 ${filing.matchesDonor ? "bg-yellow-light/50 -mx-2 px-2 py-2" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline text-base">{filing.client}</span>
                        {filing.matchesDonor && (
                          <span className="px-2 py-0.5 bg-yellow font-mono text-[10px] font-bold text-black">
                            MATCHES DONOR
                          </span>
                        )}
                      </div>
                      {filing.clientDescription && (
                        <div className="font-body text-xs text-gray-mid mt-0.5 italic">{filing.clientDescription}</div>
                      )}
                      <div className="font-mono text-xs text-gray-mid mt-0.5">
                        via {filing.registrant} ({filing.filingYear})
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      {filing.amount > 0 && (
                        <span className="font-mono text-sm font-bold">
                          ${filing.amount.toLocaleString()}
                        </span>
                      )}
                      {filing.filingUrl && (
                        <a href={filing.filingUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-red no-underline hover:underline">
                          VIEW FILING &rarr;
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Issue area badges */}
                  {(filing.issueLabels || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {filing.issueLabels.map((label, j) => (
                        <span key={j} className="px-2 py-0.5 font-mono text-[10px] font-bold bg-cream-dark border border-border text-gray-dark">
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bills lobbied on */}
                  {(filing.billsLobbied || []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {filing.billsLobbied.map((bill, j) => (
                        <a
                          key={j}
                          href={`https://www.congress.gov/search?q=${encodeURIComponent(bill)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 font-mono text-[10px] font-bold bg-red/10 border border-red/30 text-red no-underline hover:bg-red/20"
                        >
                          {bill}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Expandable details */}
                  {filing.specificIssues.length > 0 && (
                    <>
                      <div className="mt-2 font-body text-sm text-gray-mid">
                        {isExpanded ? filing.specificIssues.join(" | ") : filing.specificIssues[0].slice(0, 150)}
                        {!isExpanded && filing.specificIssues[0].length > 150 && "..."}
                      </div>
                      {(filing.specificIssues[0].length > 150 || filing.specificIssues.length > 1) && (
                        <button
                          onClick={() => {
                            const next = new Set(expandedFilings);
                            if (isExpanded) next.delete(i); else next.add(i);
                            setExpandedFilings(next);
                          }}
                          className="mt-1 font-mono text-[10px] text-red cursor-pointer hover:underline bg-transparent border-0 p-0"
                        >
                          {isExpanded ? "SHOW LESS" : "SHOW MORE"}
                        </button>
                      )}
                    </>
                  )}

                  {filing.lobbyists.length > 0 && (
                    <div className="mt-1.5 font-mono text-xs text-gray-mid">
                      Lobbyists: {filing.lobbyists.slice(0, 5).join(", ")}{filing.lobbyists.length > 5 ? ` +${filing.lobbyists.length - 5} more` : ""}
                    </div>
                  )}
                </div>
                );
              })}
            </section>
          )}

          {/* Follow the Money: Connections */}
          {!enriching && (
            <section className="border-3 border-border border-l-[6px] border-l-red p-6 bg-cream-dark">
              <h2 className="font-headline text-2xl mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                FOLLOW THE MONEY: CONNECTIONS
              </h2>
              <p className="font-mono text-xs text-gray-mid mb-4">
                Auto-detected links between campaign donors, lobbying activity, and voting record.
              </p>

              {uniqueConnections.length > 0 ? (
                <div className="space-y-3">
                  {uniqueConnections.map((conn, i) => (
                    <div key={i} className="bg-surface border-2 border-border p-4">
                      {conn.type === "lobby-vote" && (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-red/10 border border-red/30 text-red">LOBBY &rarr; VOTE</span>
                                {conn.amount && (
                                  <span className="font-mono text-xs text-gray-mid font-bold">{conn.amount} spent</span>
                                )}
                              </div>
                              <div className="font-headline text-base">{conn.entity}</div>
                              <div className="font-body text-sm text-gray-mid mt-1">
                                Lobbied on <span className="font-mono text-xs font-bold text-red">{conn.bill}</span>
                                {conn.billTitle && <> ({conn.billTitle})</>}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <span className={`px-3 py-1.5 font-mono text-sm font-bold ${
                                conn.vote === "YEA" ? "bg-green text-white" :
                                conn.vote === "NAY" ? "bg-status-red text-white" :
                                "bg-gray-mid text-white"
                              }`}>
                                {rep.lastName} voted {conn.vote}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {conn.type === "donor-lobby" && (
                        <>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-yellow border border-yellow text-black">DONOR &rarr; LOBBY</span>
                            {conn.amount && (
                              <span className="font-mono text-xs text-gray-mid font-bold">{conn.amount}</span>
                            )}
                          </div>
                          <div className="font-headline text-base">
                            Top donor <span className="text-red">{conn.entity}</span>
                          </div>
                          <div className="font-body text-sm text-gray-mid mt-1">
                            Lobbying client: {conn.lobbyClient}
                            {conn.matchedBillCount && conn.matchedBillCount > 0 && conn.matchedBills && (
                              <span className="font-mono text-xs"> &mdash; lobbied on {conn.matchedBillCount} bill{conn.matchedBillCount > 1 ? "s" : ""} that {rep.lastName} voted on</span>
                            )}
                          </div>
                          {conn.matchedBills && conn.matchedBills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {conn.matchedBills.map((mb, j) => (
                                <span key={j} className={`px-2 py-1 font-mono text-[10px] font-bold ${
                                  mb.vote === "YEA" ? "bg-green/10 border border-green/30 text-green" :
                                  mb.vote === "NAY" ? "bg-status-red/10 border border-status-red/30 text-status-red" :
                                  "bg-gray-mid/10 border border-gray-mid/30 text-gray-mid"
                                }`}>
                                  {mb.bill}: {mb.vote}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface border-2 border-border-light p-4 text-center">
                  <p className="font-body text-sm text-gray-mid">
                    No direct connections found between campaign donors and lobbying activity for {rep.fullName}.
                  </p>
                </div>
              )}

              <p className="font-mono text-[10px] text-gray-mid mt-4 leading-relaxed">
                DISCLAIMER: Correlation does not imply causation. These connections are automatically detected and may not represent direct influence.
              </p>
            </section>
          )}

          {/* Committee Hearings */}
          {!enriching && (rep.committeeHearings || []).length > 0 && (
            <section className="border-3 border-border p-6 bg-surface">
              <h2 className="font-headline text-2xl mb-5">&#127963;&#65039; Committee Hearings</h2>
              {rep.committeeHearings!.map((hearing, i) => (
                <div key={i} className="mb-4 pb-4 border-b-2 border-border-light last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 font-mono text-xs font-bold bg-black text-white">
                      {hearing.chamber.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs text-gray-mid">{hearing.date}</span>
                  </div>
                  <a
                    href={hearing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-base text-black no-underline hover:text-red"
                  >
                    {hearing.title}
                  </a>
                  <div className="font-mono text-xs text-gray-mid mt-1">{hearing.committee}</div>
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

          {/* Interest Group Ratings */}
          {rep.interestGroupRatings && rep.interestGroupRatings.length > 0 && (
            <section className="border-3 border-border p-6 bg-surface">
              <h2 className="font-headline text-2xl mb-1">Interest Group Ratings</h2>
              <p className="font-body text-sm text-gray-mid mb-5">How advocacy organizations score this member</p>
              <div className="space-y-4">
                {rep.interestGroupRatings.map((r) => {
                  // Convert letter grades to percentage widths
                  const letterToWidth: Record<string, number> = {
                    "A+": 95, "A": 90, "A-": 85, "B+": 80, "B": 75, "B-": 70,
                    "C+": 55, "C": 50, "C-": 45, "D+": 30, "D": 25, "D-": 20, "F": 10,
                  };
                  const isLetter = typeof r.score === "string";
                  const barWidth = isLetter ? (letterToWidth[r.score as string] || 10) : (r.score as number);
                  const barColor = r.lean === "left" ? "bg-[#2563EB]" : "bg-[#C1272D]";
                  return (
                    <div key={r.group}>
                      <div className="flex justify-between mb-1.5">
                        <span className="font-mono text-sm font-bold">
                          {r.icon} {r.group}
                        </span>
                        <span className="font-mono text-sm text-gray-mid">
                          {r.score}{isLetter ? "" : "/100"} ({r.year})
                        </span>
                      </div>
                      <div className="h-5 bg-cream-dark border-2 border-border">
                        <div
                          className={`${barColor} h-full transition-all`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-6 font-mono text-sm text-gray-mid">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#2563EB] inline-block border-2 border-border" /> Left-leaning groups
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#C1272D] inline-block border-2 border-border" /> Right-leaning groups
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

        {/* Right column: Contact + Money + Links */}
        <div className="space-y-6">
          {/* Sticky Contact This Rep Card */}
          <section className="border-3 border-red p-6 bg-surface lg:sticky lg:top-4 z-10">
            <h2 className="font-headline text-2xl mb-4">&#9993; Contact This Rep</h2>

            {/* Contact Form / Email buttons */}
            <div className="space-y-3 mb-5">
              {rep.contactForm && (
                <a
                  href={rep.contactForm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-5 py-4 bg-red text-white font-headline uppercase text-base text-center no-underline hover:bg-red-dark transition-colors border-3 border-red hover:border-red-dark"
                >
                  Open Contact Form &#8594;
                </a>
              )}

              <button
                onClick={openMailto}
                className="w-full px-5 py-4 bg-black text-white font-headline uppercase text-base text-center cursor-pointer hover:bg-gray-dark transition-colors border-3 border-black hover:border-gray-dark"
              >
                {latestDraft ? "Send Your Letter via Email" : "Send Email"}
              </button>

              {latestDraft?.content && (() => {
                const configStr = typeof window !== "undefined" ? localStorage.getItem("checkmyrep_email_config") : null;
                return configStr ? (
                  <button
                    onClick={sendDirectEmail}
                    disabled={emailSending}
                    className={`w-full px-5 py-4 font-headline uppercase text-base text-center cursor-pointer transition-colors border-3 ${
                      emailSending
                        ? "bg-gray-mid text-white border-gray-mid"
                        : "bg-green text-white border-green hover:bg-black hover:border-black"
                    }`}
                  >
                    {emailSending ? "Sending..." : "Send Directly via Email Service"}
                  </button>
                ) : null;
              })()}

              {emailResult && (
                <div className={`p-3 font-mono text-sm font-bold border-2 ${
                  emailResult.ok
                    ? "border-green bg-green-light text-green"
                    : "border-status-red bg-status-red-light text-status-red"
                }`}>
                  {emailResult.ok ? "\u2705" : "\u274C"} {emailResult.message}
                </div>
              )}

              {latestDraft?.content && (
                <button
                  onClick={() => setMailModalOpen(true)}
                  className="w-full px-5 py-4 font-headline uppercase text-base text-center cursor-pointer transition-colors border-3"
                  style={{ backgroundColor: "#111", color: "#fff", borderColor: "#111" }}
                >
                  Mail This Letter — $1.50
                </button>
              )}
            </div>

            {/* Call buttons for each office */}
            <div className="space-y-2 mb-5">
              <h3 className="font-mono text-sm text-gray-mid font-bold">CALL THIS OFFICE</h3>
              {rep.offices.map((office, i) => (
                <a
                  key={i}
                  href={`tel:${office.phone}`}
                  className="flex items-center justify-between w-full px-4 py-3 border-2 border-border font-mono text-sm no-underline text-black hover:bg-red hover:text-white hover:border-red transition-colors font-bold"
                >
                  <span>{office.label}</span>
                  <span>&#128222; {office.phone}</span>
                </a>
              ))}
            </div>

            {/* Office Addresses */}
            <div className="space-y-3">
              <h3 className="font-mono text-sm text-gray-mid font-bold">OFFICE ADDRESSES</h3>
              {rep.offices.map((office, i) => (
                <div key={i} className="p-3 border-2 border-border-light bg-cream">
                  <p className="font-mono text-xs text-gray-mid font-bold mb-1">{office.label.toUpperCase()}</p>
                  <p className="font-body text-sm">{office.street}</p>
                  <p className="font-body text-sm">{office.city}, {office.state} {office.zip}</p>
                </div>
              ))}
            </div>

            {latestDraft && (
              <div className="mt-4 pt-4 border-t-2 border-border-light">
                <p className="font-mono text-xs text-gray-mid font-bold">LATEST DRAFT</p>
                <p className="font-mono text-sm mt-1">
                  Re: {latestDraft.issue} ({latestDraft.date})
                </p>
              </div>
            )}

            {!rep.contactForm && (
              <div className="mt-4 p-3 bg-yellow-light border-2 border-yellow">
                <p className="font-mono text-xs font-bold text-gray-mid">
                  NOTE: Most Members of Congress do not publish direct email addresses. If no email is available, use the &quot;Send Email&quot; button to compose a draft, then paste it into the official contact form on their website.
                </p>
              </div>
            )}
          </section>

          {/* Follow the Money */}
          <section className="border-3 border-border p-6 bg-cream-dark">
            <h2 className="font-headline text-2xl mb-4">&#128176; Follow the Money</h2>

            {enriching && (
              <div className="space-y-4 motion-safe:animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-border animate-spin" style={{ animationDuration: '2s' }} />
                  <span className="font-mono text-sm text-gray-mid font-bold">LOADING LIVE FEC DATA&hellip;</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface border-2 border-border p-4">
                    <div className="h-7 bg-border/40 w-24 mx-auto mb-2" />
                    <div className="h-3 bg-border/30 w-16 mx-auto" />
                  </div>
                  <div className="bg-surface border-2 border-border p-4">
                    <div className="h-7 bg-border/40 w-16 mx-auto mb-2" />
                    <div className="h-3 bg-border/30 w-20 mx-auto" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-border/30 w-32" />
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className="flex justify-between py-2 border-b border-border-light">
                      <div className="h-4 bg-border/30 w-36" />
                      <div className="h-4 bg-border/30 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!enriching && <>

            {/* AI Analysis — prominent at top */}
            <div className="mb-5">
              {aiMessages.length === 0 && !aiLoading && (
                hasApiKey ? (
                  <button
                    onClick={() => {
                      const apiKey = localStorage.getItem("checkmyrep_api_key");
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white font-mono text-sm text-center cursor-pointer hover:bg-red transition-colors font-bold border-3 border-black hover:border-red"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    ANALYZE ALL CAMPAIGN FINANCE WITH AI
                  </button>
                ) : (
                  <Link
                    href="/settings"
                    className="block px-4 py-3 bg-surface text-gray-mid font-mono text-sm text-center no-underline border-2 border-border hover:bg-hover transition-colors font-bold"
                  >
                    SET API KEY IN SETTINGS TO ENABLE AI ANALYSIS
                  </Link>
                )
              )}

              {aiLoading && (
                <div className="bg-surface border-2 border-border p-4 text-center">
                  <p className="font-mono text-sm text-gray-mid motion-safe:animate-pulse">Analyzing campaign finance data...</p>
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
                      const apiKey = localStorage.getItem("checkmyrep_api_key");
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
                      <div className="font-mono text-xs text-gray-mid font-bold mt-1 group/tip relative inline-flex items-center gap-1 cursor-help">
                        Small Dollar
                        <span className="text-gray-mid/60 text-[10px]">&#9432;</span>
                        <span className="invisible group-hover/tip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-black text-white text-[11px] font-normal leading-tight p-2 z-10">
                          Percentage of total individual contributions that are $200 or less (per FEC definition). Higher % suggests broader grassroots support.
                        </span>
                      </div>
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

            {/* Dark Money Connections */}
            {(rep.darkMoneyConnections || []).length > 0 && (
              <div className="mb-5 border-t-2 border-border-light pt-5">
                <h3 className="font-mono text-sm text-gray-mid font-bold mb-3">DARK MONEY CONNECTIONS</h3>
                <div className="p-3 bg-surface border-2 border-border-light mb-4">
                  <p className="font-body text-sm text-gray-mid mb-2">
                    Dark money refers to political spending by nonprofits (501(c)(4)s) that aren&apos;t required to disclose their donors. These organizations can spend unlimited amounts on elections without revealing who funds them.
                  </p>
                  <a
                    href="https://www.opensecrets.org/dark-money"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-red font-bold hover:underline"
                  >
                    LEARN MORE &rarr;
                  </a>
                </div>
                <p className="font-body text-xs text-gray-mid mb-3">
                  Outside spenders with connected 501(c)(4) nonprofit organizations. Source: ProPublica.
                </p>
                {rep.darkMoneyConnections!.map((dm, i) => (
                  <div key={i} className="mb-3 pb-3 border-b border-border-light last:border-0 last:mb-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 text-xs font-mono font-bold ${dm.support ? "bg-green-700 text-white" : "bg-status-red text-white"}`}>
                        {dm.support ? "FOR" : "AGAINST"}
                      </span>
                      <span className="font-body text-sm font-bold">{dm.spenderName}</span>
                      <span className="font-mono text-xs text-gray-mid ml-auto">{dm.spenderAmount}</span>
                    </div>
                    {dm.connectedNonprofits.map((np, j) => (
                      <div key={j} className="ml-4 mt-1 p-2 bg-surface border border-border">
                        <div className="font-mono text-xs font-bold">{np.name}</div>
                        <div className="font-mono text-[10px] text-gray-mid mt-0.5">
                          Revenue: ${np.totalRevenue.toLocaleString()} | Assets: ${np.totalAssets.toLocaleString()}
                          {np.city && ` | ${np.city}, ${np.state}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

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
            </>}
          </section>

          {/* District Spending */}
          {!enriching && rep.districtSpending && rep.districtSpending.totalObligated > 0 && (
            <section className="border-3 border-border p-6 bg-cream-dark">
              <h2 className="font-headline text-2xl mb-4">
                &#127970; Federal Spending in {rep.chamber === "Senate" ? rep.state : `${rep.stateAbbr}-${rep.district}`}
              </h2>
              <p className="font-body text-xs text-gray-mid mb-4">
                Federal contracts and grants in this {rep.chamber === "Senate" ? "state" : "district"} (current fiscal year). Source: USAspending.gov.
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-surface border-2 border-border p-3 text-center">
                  <div className="font-headline text-lg">
                    ${(rep.districtSpending.totalObligated / 1_000_000).toFixed(1)}M
                  </div>
                  <div className="font-mono text-[10px] text-gray-mid font-bold">TOTAL</div>
                </div>
                <div className="bg-surface border-2 border-border p-3 text-center">
                  <div className="font-headline text-lg">{rep.districtSpending.contractCount}</div>
                  <div className="font-mono text-[10px] text-gray-mid font-bold">CONTRACTS</div>
                </div>
                <div className="bg-surface border-2 border-border p-3 text-center">
                  <div className="font-headline text-lg">{rep.districtSpending.grantCount}</div>
                  <div className="font-mono text-[10px] text-gray-mid font-bold">GRANTS</div>
                </div>
              </div>

              {rep.districtSpending.donorContractorOverlaps.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-light border-2 border-yellow">
                  <h3 className="font-mono text-xs font-bold mb-1">DONOR-CONTRACTOR OVERLAP</h3>
                  <p className="font-body text-xs text-gray-mid">
                    These organizations appear in both top donors and federal contractors:
                  </p>
                  {rep.districtSpending.donorContractorOverlaps.map((name, i) => (
                    <div key={i} className="font-mono text-sm font-bold mt-1">{name}</div>
                  ))}
                </div>
              )}

              {rep.districtSpending.topRecipients.length > 0 && (
                <div className="mb-3">
                  <h3 className="font-mono text-sm text-gray-mid font-bold mb-2">TOP RECIPIENTS</h3>
                  {rep.districtSpending.topRecipients.slice(0, 7).map((r, i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-border-light last:border-0">
                      <span className="font-body text-sm">{r.name}</span>
                      <span className="font-mono text-xs text-gray-mid font-bold">
                        ${(r.total / 1_000_000).toFixed(1)}M
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {rep.districtSpending.topAgencies.length > 0 && (
                <div>
                  <h3 className="font-mono text-sm text-gray-mid font-bold mb-2">TOP AGENCIES</h3>
                  {rep.districtSpending.topAgencies.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-border-light last:border-0">
                      <span className="font-body text-sm">{a.name}</span>
                      <span className="font-mono text-xs text-gray-mid font-bold">
                        ${(a.total / 1_000_000).toFixed(1)}M
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* FOIA — Request Records */}
          <section className="border-3 border-red bg-red-light p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl shrink-0">&#128451;</span>
              <div className="flex-1">
                <h2 className="font-headline text-xl normal-case mb-2">Request Government Records</h2>
                <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
                  Use FOIA Forge to file a Freedom of Information Act request for records related to {rep.fullName}&apos;s committees, votes, or agencies they oversee.
                </p>
                <a
                  href={`https://www.thefoiaforge.org/new-request`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red text-white font-mono text-xs font-bold no-underline hover:bg-black transition-colors"
                >
                  FILE A FOIA REQUEST
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
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

      {/* Mail Letter Modal */}
      {mailModalOpen && latestDraft?.content && (
        <MailLetterModal
          isOpen={mailModalOpen}
          onClose={() => setMailModalOpen(false)}
          letterContent={latestDraft.content}
          rep={rep}
          contactLogId={latestDraft.id}
          issue={latestDraft.issue}
        />
      )}
    </div>
  );
}
