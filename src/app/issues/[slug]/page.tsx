"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getIssueBySlug } from "@/data/issues";
import type { Representative } from "@/data/types";

const issueEmoji: Record<string, string> = {
  healthcare: "\u{1F3E5}",
  environment: "\u{1F30D}",
  housing: "\u{1F3E0}",
  immigration: "\u{1F5FD}",
  education: "\u{1F4DA}",
  economy: "\u{1F4B0}",
  "civil-rights": "\u{2696}\u{FE0F}",
  defense: "\u{1F6E1}\u{FE0F}",
};

function statusColor(status: string) {
  switch (status) {
    case "passed": return "bg-green text-white";
    case "in_committee": return "bg-yellow-light text-yellow";
    case "failed": return "bg-status-red-light text-status-red";
    default: return "bg-red-light text-red";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "passed": return "PASSED";
    case "in_committee": return "IN COMMITTEE";
    case "failed": return "FAILED";
    default: return "INTRODUCED";
  }
}

export default function IssueDetailPage() {
  const params = useParams();
  const issue = getIssueBySlug(params.slug as string);
  const [featuredReps, setFeaturedReps] = useState<Representative[]>([]);

  useEffect(() => {
    fetch("/api/members?featured=true")
      .then((r) => r.json())
      .then((reps: Representative[]) => setFeaturedReps(reps.slice(0, 4)))
      .catch(() => {});
  }, []);

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="font-headline text-5xl">Issue Not Found</h1>
        <Link href="/issues" className="inline-block mt-6 px-8 py-4 bg-black text-white font-headline uppercase text-base no-underline hover:bg-red transition-colors">
          Back to Issues
        </Link>
      </div>
    );
  }

  const emoji = issueEmoji[issue.id] || issue.icon;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/issues" className="font-mono text-sm text-gray-mid hover:text-red no-underline font-bold">
        &larr; BACK TO ISSUES
      </Link>

      {/* Header */}
      <div className="mt-4 bg-black text-white border-3 border-border p-8">
        <span className="text-5xl block mb-4">{emoji}</span>
        <h1 className="font-headline text-5xl md:text-6xl normal-case text-white">
          {issue.name}
        </h1>
        <p className="mt-4 font-body text-lg text-white/85">
          {issue.description}
        </p>
        <Link
          href={`/draft?issue=${issue.slug}`}
          className="inline-block mt-6 px-8 py-4 bg-red text-white font-headline uppercase text-base no-underline hover:bg-red-dark transition-colors border-3 border-red hover:border-red-dark"
        >
          Take Action on {issue.name} &rarr;
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Explainer */}
          <section className="border-3 border-border p-6 bg-surface">
            <h2 className="font-headline text-2xl mb-4">{"\u{1F4D6}"} What You Need to Know</h2>
            <p className="font-body text-base leading-relaxed text-gray-mid">{issue.explainer}</p>
          </section>

          {/* Legislation Feed */}
          <section className="border-3 border-border p-6 bg-surface">
            <h2 className="font-headline text-2xl mb-5">{"\u{1F4DC}"} Current Legislation</h2>
            {issue.legislation.length === 0 ? (
              <p className="font-mono text-base text-gray-mid">No tracked legislation for this issue yet.</p>
            ) : (
              <div className="space-y-4">
                {issue.legislation.map((bill) => (
                  <div key={bill.id} className="border-2 border-border-light p-5 bg-cream">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`px-3 py-1 font-mono text-xs font-bold ${statusColor(bill.status)}`}>
                        {statusLabel(bill.status)}
                      </span>
                      <span className="font-mono text-sm text-gray-mid font-bold">{bill.billNumber}</span>
                      <span className="font-mono text-sm text-gray-mid">{bill.date}</span>
                    </div>
                    <h3 className="font-headline text-lg normal-case">{bill.title}</h3>
                    <p className="font-mono text-sm text-gray-mid mt-1 font-bold">
                      Sponsor: {bill.sponsor}
                    </p>
                    <p className="font-body text-base text-gray-mid mt-2">{bill.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Related reps */}
          <section className="border-3 border-border p-6 bg-surface">
            <h2 className="font-headline text-2xl mb-5">{"\u{1F465}"} Write to These Members</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredReps.map((rep) => (
                <Link
                  key={rep.id}
                  href={`/draft?rep=${rep.slug}&issue=${issue.slug}`}
                  className="no-underline text-black border-2 border-border p-4 hover:bg-hover transition-colors flex items-center gap-3 group"
                >
                  <div className={`w-10 h-10 ${rep.party === "D" ? "bg-dem" : rep.party === "R" ? "bg-rep" : "bg-ind"} flex items-center justify-center shrink-0`}>
                    <span className="font-headline text-sm text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                  </div>
                  <div>
                    <div className="font-headline text-base normal-case group-hover:text-red">{rep.fullName}</div>
                    <div className="font-mono text-xs text-gray-mid">{rep.title} — {rep.state}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Talking Points */}
          <section className="border-3 border-border p-6 bg-cream-dark">
            <h2 className="font-headline text-2xl mb-5">{"\u{1F4AC}"} Talking Points</h2>
            <div className="space-y-4">
              {issue.talkingPoints.map((point, i) => (
                <div key={i} className="border-l-4 border-red pl-4 py-1">
                  <p className="font-body text-base text-gray-mid">{point}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className="border-3 border-border p-6 bg-surface">
            <h2 className="font-headline text-2xl mb-4">Take Action</h2>
            <p className="font-body text-base text-gray-mid mb-5">
              Use these talking points to draft a letter, call script, or social
              post to your representatives.
            </p>
            <Link
              href={`/draft?issue=${issue.slug}`}
              className="block px-5 py-4 bg-red text-white font-headline uppercase text-base text-center no-underline hover:bg-red-dark transition-colors mb-3"
            >
              {"\u{270F}\u{FE0F}"} Draft a Letter
            </Link>
            <Link
              href={`/draft?issue=${issue.slug}&mode=call`}
              className="block px-5 py-4 bg-black text-white font-headline uppercase text-base text-center no-underline hover:bg-gray-dark transition-colors mb-3"
            >
              {"\u{1F4DE}"} Call Script
            </Link>
            <Link
              href="/directory"
              className="block px-5 py-4 bg-black text-white font-headline uppercase text-base text-center no-underline hover:bg-gray-dark transition-colors"
            >
              {"\u{1F50D}"} Find Your Rep
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
