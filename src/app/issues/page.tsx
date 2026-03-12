"use client";

import Link from "next/link";
import { issues } from "@/data/issues";

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

export default function IssuesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Issues Hub</h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        UNDERSTAND THE ISSUES. KNOW THE FACTS. TAKE INFORMED ACTION.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {issues.map((issue) => {
          const accent = issueAccent[issue.id] || "border-l-border";
          const emoji = issueEmoji[issue.id] || issue.icon;
          return (
            <Link
              key={issue.id}
              href={`/issues/${issue.slug}`}
              className={`no-underline text-black border-2 border-border bg-surface p-6 hover:bg-hover transition-colors group border-l-6 ${accent}`}
            >
              <span className="text-5xl block mb-4">{emoji}</span>
              <h2 className="font-headline text-3xl normal-case">
                {issue.name}
              </h2>
              <p className="font-body text-base mt-3 text-gray-mid">
                {issue.description}
              </p>
              <div className="mt-4 pt-4 border-t-2 border-border-light flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-gray-mid">
                  {issue.legislation.length} active {issue.legislation.length === 1 ? "bill" : "bills"} &middot;{" "}
                  {issue.talkingPoints.length} talking points
                </span>
                <span className="font-headline text-sm text-black group-hover:text-red group-hover:translate-x-1 transition-transform">
                  EXPLORE &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Explainer section */}
      <section className="mt-12 border-3 border-border bg-surface p-8">
        <h2 className="font-headline text-3xl mb-6">How to Make Your Voice Heard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="border-2 border-border p-5 bg-cream-dark">
            <span className="text-3xl block mb-2">{"\u{1F4DE}"}</span>
            <h3 className="font-headline text-xl normal-case mb-3">When to Call</h3>
            <p className="font-body text-base text-gray-mid">
              Call when a bill is up for a vote or in committee. Phone calls are
              logged as constituent contacts and taken seriously. Call the DC office
              9am-5pm ET. State your name, ZIP, and position clearly.
            </p>
          </div>
          <div className="border-2 border-border p-5 bg-cream-dark">
            <span className="text-3xl block mb-2">{"\u{2709}\u{FE0F}"}</span>
            <h3 className="font-headline text-xl normal-case mb-3">When to Write</h3>
            <p className="font-body text-base text-gray-mid">
              Write when you want to explain your position in detail or share a
              personal story. Letters carry more weight than emails. A physical letter
              to the district office shows serious commitment.
            </p>
          </div>
          <div className="border-2 border-border p-5 bg-cream-dark">
            <span className="text-3xl block mb-2">{"\u{1F4F1}"}</span>
            <h3 className="font-headline text-xl normal-case mb-3">When to Post</h3>
            <p className="font-body text-base text-gray-mid">
              Post publicly when you want social pressure or to join a broader
              movement. Tag your rep directly. Public posts get tracked by comms
              staff. Call first, then post to encourage others.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
