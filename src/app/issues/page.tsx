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
  environment: "center top",
  immigration: "left bottom",
};

const issueSummary: Record<string, string> = {
  healthcare:
    "Drug prices are 2-3x higher than peer nations. The $35 insulin cap only covers Medicare. Rural ERs are closing. Mental health parity is law but rarely enforced.",
  environment:
    "$369B in climate investment is now law — but implementation is stalling. Extreme weather cost $90B+ last year alone. Clean energy jobs are outpacing fossil fuels in most states.",
  housing:
    "7 million affordable homes short. Rent up 30% since 2019. Only 1 in 4 eligible families get federal help. Record homelessness in 2023 — over 650,000 in a single night.",
  immigration:
    "3 million case backlog, 4-year average wait. DACA covers 580K people but faces legal challenges. The last major reform was in 1986. A bipartisan border deal failed in early 2024.",
  education:
    "$1.7 trillion in student debt across 43 million borrowers. Pell Grants cover 30% of tuition, down from 80% in the 1970s. Teachers earn 26% less than other college grads.",
  economy:
    "Federal minimum wage frozen at $7.25 since 2009. CEO-to-worker pay ratio: 272:1. The top 1% holds more wealth than the bottom 50%. National debt interest now exceeds $1T/year.",
  "civil-rights":
    "1.9 million incarcerated — highest rate on Earth. Black Americans imprisoned at 5x the rate. The Voting Rights Act was gutted in 2013. 28 states lack LGBTQ+ housing protections.",
  defense:
    "$886B defense budget — more than the next 10 nations combined. Foreign aid is under 1% of the budget. The PACT Act expanded VA care for 3.4M veterans with toxic exposure.",
};

export default function IssuesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">
        The Issues
      </h1>
      <p className="font-mono text-sm text-gray-500 mb-10 font-bold">
        REAL NUMBERS. REAL STAKES. PICK AN ISSUE AND DIG IN.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {issues.map((issue) => {
          const accent = issueColor[issue.id] || "#1a1a2e";
          const bgImage = issueImage[issue.id];
          const bgPos = issuePosition[issue.id] || "center";
          const summary = issueSummary[issue.id] || issue.description;
          return (
            <Link
              key={issue.id}
              href={`/issues/${issue.slug}`}
              className="no-underline group relative overflow-hidden transition-all hover:shadow-xl"
              style={{
                border: "2px solid rgba(0,0,0,0.1)",
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Background image */}
              <div className="relative w-full" style={{ height: "180px" }}>
                <div
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: bgPos,
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)`,
                  }}
                />
                {/* Accent bar at top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: accent }}
                />
                {/* Issue name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2
                    className="font-headline text-2xl md:text-3xl uppercase"
                    style={{
                      color: "#fff",
                      textShadow:
                        "0 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.4)",
                    }}
                  >
                    {issue.name}
                  </h2>
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 flex flex-col p-5 bg-white">
                <p className="font-body text-sm text-gray-600 leading-relaxed flex-1">
                  {summary}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className="font-headline text-lg tracking-wider group-hover:translate-x-2 transition-transform"
                    style={{ color: accent }}
                  >
                    EXPLORE &rarr;
                  </span>
                </div>
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
          <div className="border-2 border-gray-200 p-5 bg-white">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
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
          </div>
          <div className="border-2 border-gray-200 p-5 bg-white">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
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
          </div>
          <div className="border-2 border-gray-200 p-5 bg-white">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
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
          </div>
        </div>
      </section>
    </div>
  );
}
