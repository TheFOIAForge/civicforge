"use client";

import Link from "next/link";
import { issues } from "@/data/issues";

const issueImage: Record<string, string> = {
  healthcare: "/images/issues/healthcare.jpg",
  environment: "/images/issues/environment.jpg",
  housing: "/images/issues/housing.jpg",
  immigration: "/images/issues/immigration.jpg",
  education: "/images/issues/education.jpg",
  economy: "/images/issues/economy.jpg",
  "civil-rights": "/images/issues/civil-rights.jpg",
  defense: "/images/issues/defense.jpg",
};

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

const issuePosition: Record<string, string> = {
  environment: "15% 20%",
};

const issueZoom: Record<string, string> = {
  environment: "180%",
};

const issueStat: Record<string, string> = {
  healthcare: "Drug prices 2-3x higher than peer nations",
  environment: "$369B climate investment — implementation stalling",
  housing: "7M affordable homes short, rent up 30%",
  immigration: "3M case backlog, 4-year average wait",
  education: "$1.7T student debt across 43M borrowers",
  economy: "Minimum wage frozen since 2009 at $7.25",
  "civil-rights": "1.9M incarcerated — highest rate on Earth",
  defense: "$886B budget — more than next 10 nations",
};

export default function IssuesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-headline text-4xl md:text-5xl mb-1">
        The Issues
      </h1>
      <p className="font-mono text-xs text-gray-500 mb-5 font-bold">
        REAL NUMBERS. REAL STAKES. PICK AN ISSUE AND DIG IN.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {issues.map((issue) => {
          const accent = issueColor[issue.id] || "#1a1a2e";
          const bgImage = issueImage[issue.id];
          const bgPos = issuePosition[issue.id] || "center";
          const bgSize = issueZoom[issue.id] || "cover";
          const stat = issueStat[issue.id];
          return (
            <Link
              key={issue.id}
              href={`/issues/${issue.slug}`}
              className="no-underline group relative overflow-hidden transition-all hover:shadow-xl"
              style={{ height: "220px" }}
            >
              {/* Full-bleed background */}
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${bgImage})`,
                  backgroundSize: bgSize,
                  backgroundPosition: bgPos,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(0,0,0,0.65) 100%)`,
                }}
              />
              {/* Accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: accent }}
              />
              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h2
                  className="font-headline text-lg md:text-xl uppercase leading-tight"
                  style={{
                    color: "#fff",
                    textShadow: "0 2px 6px rgba(0,0,0,0.8)",
                  }}
                >
                  {issue.name}
                </h2>
                {stat && (
                  <p
                    className="font-mono text-[10px] md:text-xs mt-1 leading-snug"
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                    }}
                  >
                    {stat}
                  </p>
                )}
                <span
                  className="inline-block mt-1.5 font-headline text-xs tracking-wider group-hover:translate-x-1 transition-transform"
                  style={{ color: accent }}
                >
                  EXPLORE &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Explainer section */}
      <section className="mt-12 border-2 border-gray-200 bg-gray-50 p-8">
        <h2 className="font-headline text-3xl mb-6">
          How to Make Your Voice Heard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/draft?mode=call" className="no-underline text-inherit border-2 border-gray-200 p-5 bg-white hover:shadow-lg hover:border-gray-300 transition-all group">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-3">
              When to Call
            </h3>
            <p className="font-body text-base text-gray-500">
              Call when a bill is up for a vote or in committee. Phone calls are
              logged as constituent contacts and taken seriously. Call the DC
              office 9am-5pm ET. State your name, ZIP, and position clearly.
            </p>
            <span className="inline-block mt-3 font-headline text-sm text-gray-400 group-hover:text-red group-hover:translate-x-1 transition-all">
              START A CALL SCRIPT &rarr;
            </span>
          </Link>
          <Link href="/draft" className="no-underline text-inherit border-2 border-gray-200 p-5 bg-white hover:shadow-lg hover:border-gray-300 transition-all group">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-3">
              When to Write
            </h3>
            <p className="font-body text-base text-gray-500">
              Write when you want to explain your position in detail or share a
              personal story. Letters carry more weight than emails. A physical
              letter to the district office shows serious commitment.
            </p>
            <span className="inline-block mt-3 font-headline text-sm text-gray-400 group-hover:text-red group-hover:translate-x-1 transition-all">
              WRITE A LETTER &rarr;
            </span>
          </Link>
          <Link href="/draft?mode=social" className="no-underline text-inherit border-2 border-gray-200 p-5 bg-white hover:shadow-lg hover:border-gray-300 transition-all group">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-3">
              When to Post
            </h3>
            <p className="font-body text-base text-gray-500">
              Post publicly when you want social pressure or to join a broader
              movement. Tag your rep directly. Public posts get tracked by comms
              staff. Call first, then post to encourage others.
            </p>
            <span className="inline-block mt-3 font-headline text-sm text-gray-400 group-hover:text-red group-hover:translate-x-1 transition-all">
              DRAFT A POST &rarr;
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
