"use client";

import Link from "next/link";
import { issues } from "@/data/issues";

const issueColor: Record<string, string> = {
  healthcare: "#c62828",
  environment: "#2e7d32",
  housing: "#e65100",
  immigration: "#1565c0",
  education: "#6a1b9a",
  economy: "#f9a825",
  "civil-rights": "#37474f",
  defense: "#1a1a2e",
};

const issueSvgPath: Record<string, string> = {
  healthcare:
    "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  environment:
    "M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.95 7.95l-.71-.71M4.76 4.76l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  housing:
    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  immigration:
    "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  education:
    "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
  economy:
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "civil-rights":
    "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  defense:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
};

export default function IssuesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">
        Issues That Matter
      </h1>
      <p className="font-mono text-sm text-gray-mid mb-10 font-bold">
        UNDERSTAND THE ISSUES. KNOW THE FACTS. TAKE INFORMED ACTION.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {issues.map((issue) => {
          const accent = issueColor[issue.id] || "#1a1a2e";
          return (
            <Link
              key={issue.id}
              href={`/issues/${issue.slug}`}
              className="no-underline text-black bg-surface hover:bg-hover transition-all group border-2 border-border relative overflow-hidden"
            >
              {/* Accent top bar */}
              <div className="h-2 w-full" style={{ backgroundColor: accent }} />
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-5">
                  {/* Icon block */}
                  <div
                    className="w-14 h-14 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: accent }}
                  >
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={issueSvgPath[issue.id] || "M12 6v12m-6-6h12"}
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-headline text-2xl md:text-3xl normal-case group-hover:text-red transition-colors">
                      {issue.name}
                    </h2>
                    <p className="font-body text-base mt-2 text-gray-mid leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t-2 border-border-light flex items-center justify-between">
                  <div className="flex gap-4">
                    <span className="font-mono text-xs font-bold uppercase px-2 py-1 border border-border bg-cream-dark">
                      {issue.legislation.length}{" "}
                      {issue.legislation.length === 1 ? "bill" : "bills"}
                    </span>
                    <span className="font-mono text-xs font-bold uppercase px-2 py-1 border border-border bg-cream-dark">
                      {issue.talkingPoints.length} talking points
                    </span>
                  </div>
                  <span className="font-headline text-sm text-black/40 group-hover:text-red group-hover:translate-x-1 transition-all">
                    EXPLORE &rarr;
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Explainer section */}
      <section className="mt-12 border-3 border-border bg-surface p-8">
        <h2 className="font-headline text-3xl mb-6">
          How to Make Your Voice Heard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="border-2 border-border p-5 bg-cream-dark">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-3">
              When to Call
            </h3>
            <p className="font-body text-base text-gray-mid">
              Call when a bill is up for a vote or in committee. Phone calls are
              logged as constituent contacts and taken seriously. Call the DC
              office 9am-5pm ET. State your name, ZIP, and position clearly.
            </p>
          </div>
          <div className="border-2 border-border p-5 bg-cream-dark">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-3">
              When to Write
            </h3>
            <p className="font-body text-base text-gray-mid">
              Write when you want to explain your position in detail or share a
              personal story. Letters carry more weight than emails. A physical
              letter to the district office shows serious commitment.
            </p>
          </div>
          <div className="border-2 border-border p-5 bg-cream-dark">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-3">
              When to Post
            </h3>
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
