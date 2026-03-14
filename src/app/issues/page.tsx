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
  healthcare: "#C1272D",
  environment: "#C1272D",
  housing: "#C1272D",
  immigration: "#C1272D",
  education: "#C1272D",
  economy: "#c4a44a",
  "civil-rights": "#C1272D",
  defense: "#C1272D",
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
      <h1 className="font-headline text-4xl md:text-5xl mb-1" style={{ color: "#1a1a1a" }}>
        The Issues
      </h1>
      <p className="font-mono text-xs mb-1 font-bold" style={{ color: "#c4a44a", letterSpacing: "0.15em" }}>
        &#9733; &#9733; &#9733;
      </p>
      <p className="font-mono text-xs mb-5 font-bold" style={{ color: "#5a5a5a" }}>
        REAL NUMBERS. REAL STAKES. PICK AN ISSUE AND DIG IN.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {issues.map((issue) => {
          const accent = issueColor[issue.id] || "#C1272D";
          const bgImage = issueImage[issue.id];
          const bgPos = issuePosition[issue.id] || "center";
          const bgSize = issueZoom[issue.id] || "cover";
          const stat = issueStat[issue.id];
          return (
            <Link
              key={issue.id}
              href={`/issues/${issue.slug}`}
              className="no-underline group relative overflow-hidden transition-all hover:shadow-xl"
              style={{ height: "220px", border: "3px solid #1a1a1a" }}
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
                  background: `linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(26,26,26,0.75) 100%)`,
                }}
              />
              {/* Accent bar */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{ backgroundColor: accent, height: "4px" }}
              />
              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h2
                  className="font-headline text-lg md:text-xl uppercase leading-tight"
                  style={{
                    color: "#faf6ee",
                    textShadow: "0 2px 6px rgba(0,0,0,0.8)",
                  }}
                >
                  {issue.name}
                </h2>
                {stat && (
                  <p
                    className="font-mono text-[10px] md:text-xs mt-1 leading-snug"
                    style={{
                      color: "rgba(250,246,238,0.85)",
                      textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                    }}
                  >
                    {stat}
                  </p>
                )}
                <span
                  className="inline-block mt-1.5 font-headline text-xs tracking-wider group-hover:translate-x-1 transition-transform"
                  style={{ color: "#c4a44a" }}
                >
                  EXPLORE &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Explainer section */}
      <div className="flex items-center justify-center my-8">
        <span style={{ color: "#c4a44a", letterSpacing: "0.3em" }} className="font-mono text-sm">&#9733; &#9733; &#9733; &#9733; &#9733;</span>
      </div>
      <section className="mt-0 p-8" style={{ border: "3px solid #1a1a1a", backgroundColor: "#f5e6c8" }}>
        <h2 className="font-headline text-3xl mb-2" style={{ color: "#1a1a1a" }}>
          How to Make Your Voice Heard
        </h2>
        <p className="font-mono text-xs mb-6 font-bold" style={{ color: "#c4a44a" }}>&#9733; &#9733; &#9733;</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/draft?mode=call" className="no-underline text-inherit p-5 hover:shadow-lg transition-all group" style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee" }}>
            <div className="w-10 h-10 flex items-center justify-center mb-3" style={{ backgroundColor: "#C1272D" }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-3" style={{ color: "#1a1a1a" }}>
              When to Call
            </h3>
            <p className="font-body text-base" style={{ color: "#5a5a5a" }}>
              Call when a bill is up for a vote or in committee. Phone calls are
              logged as constituent contacts and taken seriously. Call the DC
              office 9am-5pm ET. State your name, ZIP, and position clearly.
            </p>
            <span className="inline-block mt-3 font-headline text-sm transition-all" style={{ color: "#c4a44a" }}>
              START A CALL SCRIPT &rarr;
            </span>
          </Link>
          <Link href="/draft" className="no-underline text-inherit p-5 hover:shadow-lg transition-all group" style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee" }}>
            <div className="w-10 h-10 flex items-center justify-center mb-3" style={{ backgroundColor: "#C1272D" }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-3" style={{ color: "#1a1a1a" }}>
              When to Write
            </h3>
            <p className="font-body text-base" style={{ color: "#5a5a5a" }}>
              Write when you want to explain your position in detail or share a
              personal story. Letters carry more weight than emails. A physical
              letter to the district office shows serious commitment.
            </p>
            <span className="inline-block mt-3 font-headline text-sm transition-all" style={{ color: "#c4a44a" }}>
              WRITE A LETTER &rarr;
            </span>
          </Link>
          <Link href="/draft?mode=social" className="no-underline text-inherit p-5 hover:shadow-lg transition-all group" style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee" }}>
            <div className="w-10 h-10 flex items-center justify-center mb-3" style={{ backgroundColor: "#C1272D" }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-3" style={{ color: "#1a1a1a" }}>
              When to Post
            </h3>
            <p className="font-body text-base" style={{ color: "#5a5a5a" }}>
              Post publicly when you want social pressure or to join a broader
              movement. Tag your rep directly. Public posts get tracked by comms
              staff. Call first, then post to encourage others.
            </p>
            <span className="inline-block mt-3 font-headline text-sm transition-all" style={{ color: "#c4a44a" }}>
              DRAFT A POST &rarr;
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
