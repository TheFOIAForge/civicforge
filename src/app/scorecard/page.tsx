"use client";

import Link from "next/link";
import Image from "next/image";
import { useScorecard } from "@/lib/scorecard-context";
import { useMyReps } from "@/lib/my-reps-context";
/* eslint-disable @next/next/no-img-element */

function partyBadge(party: string) {
  if (party === "D") return { label: "DEM", cls: "bg-dem text-white" };
  if (party === "R") return { label: "GOP", cls: "bg-rep text-white" };
  return { label: "IND", cls: "bg-ind text-white" };
}

export default function ScorecardPage() {
  const { userVotes, getAlignment, removeVote } = useScorecard();
  const { myReps, hasSavedReps } = useMyReps();

  // No saved reps
  if (!hasSavedReps) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-4 mb-8">
          <img src="/images/civic/icons/voter-guide.png" alt="" className="w-10 h-10 mt-1 opacity-80" aria-hidden="true" />
          <div>
            <h1 className="font-sans font-bold text-5xl md:text-6xl mb-2">My Scorecard</h1>
            <p className="font-mono text-sm text-gray-mid font-bold">
              TRACK HOW YOUR REPRESENTATIVES VOTE ON ISSUES YOU CARE ABOUT
            </p>
          </div>
        </div>
        <div className="border-3 border-border p-16 text-center bg-surface">
          <img src="/images/civic/illustrations/track-ballot.png" alt="" className="w-20 h-20 mx-auto mb-4 opacity-50" aria-hidden="true" />
          <h2 className="font-sans font-bold text-3xl mb-3">Save Your Representatives First</h2>
          <p className="font-sans text-lg text-gray-mid mb-6">
            Add your representatives to see how their votes align with your positions.
          </p>
          <Link
            href="/my-reps"
            className="inline-block px-8 py-4 bg-red text-cream font-sans font-bold uppercase text-base no-underline hover:bg-red-dark transition-colors border-3 border-black"
          >
            Find My Representatives
          </Link>
        </div>
      </div>
    );
  }

  // No user votes
  if (userVotes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-4 mb-8">
          <img src="/images/civic/icons/voter-guide.png" alt="" className="w-10 h-10 mt-1 opacity-80" aria-hidden="true" />
          <div>
            <h1 className="font-sans font-bold text-5xl md:text-6xl mb-2">My Scorecard</h1>
            <p className="font-mono text-sm text-gray-mid font-bold">
              TRACK HOW YOUR REPRESENTATIVES VOTE ON ISSUES YOU CARE ABOUT
            </p>
          </div>
        </div>
        <div className="border-3 border-border p-16 text-center bg-surface">
          <img src="/images/civic/icons/ballot.png" alt="" className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
          <h2 className="font-sans font-bold text-3xl mb-3">Start Voting on Bills</h2>
          <p className="font-sans text-lg text-gray-mid mb-6">
            Record your position on bills to see how your representatives align with you.
          </p>
          <Link
            href="/votes"
            className="inline-block px-8 py-4 bg-red text-cream font-sans font-bold uppercase text-base no-underline hover:bg-red-dark transition-colors border-3 border-black"
          >
            Vote on Bills
          </Link>
        </div>
      </div>
    );
  }

  // Build alignments
  const repAlignments = myReps.map((rep) => ({
    rep,
    alignment: getAlignment(rep),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start gap-4 mb-8">
        <img src="/images/civic/icons/voter-guide.png" alt="" className="w-10 h-10 mt-1 opacity-80" aria-hidden="true" />
        <div>
          <h1 className="font-sans font-bold text-5xl md:text-6xl mb-2">My Scorecard</h1>
          <p className="font-mono text-sm text-gray-mid font-bold">
            TRACK HOW YOUR REPRESENTATIVES VOTE ON ISSUES YOU CARE ABOUT
          </p>
        </div>
      </div>

      {/* Rep alignment cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {repAlignments.map(({ rep, alignment }) => {
          const badge = partyBadge(rep.party);
          const hasData = alignment.total > 0;
          const greenDeg = hasData ? (alignment.score / 100) * 360 : 0;
          const redDeg = hasData ? 360 - greenDeg : 0;
          const conicGradient = hasData
            ? `conic-gradient(#22c55e ${greenDeg}deg, #ef4444 ${greenDeg}deg ${greenDeg + redDeg}deg)`
            : "conic-gradient(#d1d5db 0deg, #d1d5db 360deg)";

          return (
            <div key={rep.id} className="border-3 border-border bg-surface p-6">
              {/* Rep info */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 ${rep.party === "D" ? "bg-dem" : rep.party === "R" ? "bg-rep" : "bg-ind"} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                  <span className="font-sans font-bold text-base text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                  {rep.photoUrl && (
                    <Image src={rep.photoUrl} alt="" fill sizes="48px" className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </div>
                <div>
                  <h2 className="font-sans font-bold text-lg normal-case leading-tight">{rep.fullName}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 font-mono text-[10px] font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <span className="font-mono text-[10px] text-gray-mid">
                      {rep.title} - {rep.stateAbbr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Donut chart */}
              <div className="flex items-center justify-center mb-4">
                <div
                  className="relative w-32 h-32 flex items-center justify-center"
                  style={{
                    background: conicGradient,
                    borderRadius: "50%",
                  }}
                >
                  <div className="w-20 h-20 bg-surface flex items-center justify-center" style={{ borderRadius: "50%" }}>
                    <span className="font-sans font-bold text-2xl">
                      {hasData ? `${alignment.score}%` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-center font-mono text-xs text-gray-mid font-bold">
                {hasData
                  ? `${alignment.matched} OF ${alignment.total} VOTES MATCH`
                  : "NO OVERLAPPING VOTES YET"}
              </p>

              {/* Link to profile */}
              <Link
                href={`/directory/${rep.slug}`}
                className="block mt-4 text-center font-mono text-xs text-gold no-underline font-bold hover:text-red transition-colors"
              >
                VIEW FULL PROFILE
              </Link>
            </div>
          );
        })}
      </div>

      {/* Vote comparison table */}
      <section className="border-3 border-border bg-surface p-6 mb-8">
        <h2 className="font-sans font-bold text-2xl mb-4">Your Votes vs. Your Reps</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black text-cream">
                <th scope="col" className="text-left px-4 py-3 font-mono text-xs font-bold uppercase">
                  Bill
                </th>
                <th scope="col" className="text-left px-4 py-3 font-mono text-xs font-bold uppercase">
                  Your Position
                </th>
                {myReps.map((rep) => (
                  <th key={rep.id} scope="col" className="text-left px-4 py-3 font-mono text-xs font-bold uppercase">
                    {rep.lastName}
                  </th>
                ))}
                <th scope="col" className="text-left px-4 py-3 font-mono text-xs font-bold uppercase">
                  Remove
                </th>
              </tr>
            </thead>
            <tbody>
              {userVotes.map((vote, i) => {
                const repDetails = myReps.map((rep) => {
                  const alignment = getAlignment(rep);
                  const detail = alignment.details.find((d) => d.billId === vote.billId);
                  return { rep, detail };
                });

                return (
                  <tr
                    key={vote.billId}
                    className={`border-t border-border-light ${i % 2 === 0 ? "bg-surface" : "bg-cream-dark"}`}
                  >
                    <td className="px-4 py-3 font-sans text-sm font-bold max-w-[200px]">
                      <span className="line-clamp-2">{vote.billTitle}</span>
                      <span className="block font-mono text-[10px] text-gray-mid mt-0.5">
                        {vote.billId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 font-mono text-xs font-bold border ${
                        vote.userPosition === "YEA"
                          ? "bg-green-light border-green text-green"
                          : "bg-status-red-light border-status-red text-status-red"
                      }`}>
                        {vote.userPosition}
                      </span>
                    </td>
                    {repDetails.map(({ rep, detail }) => (
                      <td key={rep.id} className="px-4 py-3">
                        {detail?.repVote ? (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 font-mono text-xs font-bold border ${
                            detail.repVote === "YEA"
                              ? "bg-green-light border-green text-green"
                              : detail.repVote === "NAY"
                                ? "bg-status-red-light border-status-red text-status-red"
                                : "bg-cream-dark border-border text-gray-mid"
                          }`}>
                            {detail.repVote}
                            {detail.matched && <span title="Matches your position">&#10003;</span>}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-gray-mid">--</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeVote(vote.billId)}
                        className="font-mono text-xs text-gray-mid hover:text-red cursor-pointer font-bold"
                        title="Remove your vote"
                      >
                        &#10005;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/votes"
          className="inline-block px-8 py-4 bg-red text-cream font-sans font-bold uppercase text-base no-underline hover:bg-red-dark transition-colors border-3 border-black"
        >
          Vote on More Bills &rarr;
        </Link>
      </div>
    </div>
  );
}
