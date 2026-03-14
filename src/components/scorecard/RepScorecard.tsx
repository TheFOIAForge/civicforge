"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Representative } from "@/data/types";
import PoliticalSpectrumBar from "./PoliticalSpectrumBar";
import RepScorecardMetrics from "./RepScorecardMetrics";
import Card from "@/components/ui/Card";
import {
  Mail,
  PenLine,
  Phone,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Award,
  AlertTriangle,
  Scale,
  Users,
  BookmarkPlus,
} from "lucide-react";

const partyConfig: Record<string, { label: string; bg: string; text: string; accent: string; border: string }> = {
  D: { label: "Democrat", bg: "bg-blue", text: "text-blue", accent: "#2563EB", border: "border-blue/20" },
  R: { label: "Republican", bg: "bg-red", text: "text-red", accent: "#DC2626", border: "border-red/20" },
  I: { label: "Independent", bg: "bg-purple-600", text: "text-purple-600", accent: "#7C3AED", border: "border-purple-200" },
};

interface Props {
  rep: Representative;
  onRemove?: () => void;
  showSaveButton?: boolean;
  onSave?: () => void;
}

export default function RepScorecard({ rep, onRemove, showSaveButton, onSave }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [enrichedRep, setEnrichedRep] = useState<Representative>(rep);
  const [enriching, setEnriching] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fetchedRef = useRef(false);

  const party = partyConfig[rep.party] || partyConfig.I;

  // Eagerly fetch enriched data on mount for accurate metrics + spectrum
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setEnriching(true);
    fetch(`/api/members/${rep.id}`)
      .then((r) => r.json())
      .then((data: Representative) => {
        setEnrichedRep(data);
        setEnriching(false);
      })
      .catch(() => setEnriching(false));
  }, [rep.id]);

  // Build a concise AI-like summary from available data
  const summary = buildSummary(enrichedRep);

  return (
    <Card padding="none" className="overflow-hidden group">
      {/* Party accent stripe */}
      <div className="h-1" style={{ backgroundColor: party.accent }} />

      <div className="p-5 sm:p-6">
        {/* ── Header: Photo + Identity ── */}
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="relative shrink-0">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center ${party.bg} shadow-sm`}
            >
              <span className="text-white font-bold text-xl sm:text-2xl">
                {rep.firstName[0]}{rep.lastName[0]}
              </span>
              {rep.photoUrl && !imgError && (
                <Image
                  src={rep.photoUrl}
                  alt={rep.fullName}
                  fill
                  sizes="96px"
                  className="object-cover rounded-2xl"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
            {/* Chamber badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center">
              <span className="text-[9px] font-bold text-navy">
                {rep.chamber === "Senate" ? "S" : "H"}
              </span>
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-full text-white ${party.bg} tracking-wide`}>
                {party.label}
              </span>
              {rep.leadershipRole && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gold-50 text-gold-dark border border-gold/20">
                  <Award className="w-2.5 h-2.5" />
                  {rep.leadershipRole}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-navy mt-1.5 leading-tight truncate">
              {rep.fullName}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {rep.title} — {rep.state}
              {rep.district ? `, District ${rep.district}` : ""}
            </p>
          </div>

          {/* Remove button if available */}
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red hover:bg-red-light transition-colors"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Political Spectrum ── */}
        <div className="mt-5">
          <PoliticalSpectrumBar
            ratings={enrichedRep.interestGroupRatings}
            party={rep.party}
          />
        </div>

        {/* ── Summary ── */}
        <p className="mt-4 text-[13px] leading-relaxed text-gray-600">
          {summary}
        </p>

        {/* ── Metrics Grid ── */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <RepScorecardMetrics
            partyLoyalty={enrichedRep.partyLoyalty || rep.partyLoyalty}
            billsIntroduced={enrichedRep.billsIntroduced || rep.billsIntroduced}
            billsEnacted={enrichedRep.billsEnacted || rep.billsEnacted}
            committeesCount={(enrichedRep.committees || rep.committees).length}
            missedVotes={enrichedRep.missedVotes || rep.missedVotes}
            votesCast={enrichedRep.votesCast || rep.votesCast}
          />
        </div>

        {/* ── Action Buttons ── */}
        <div className="mt-5 flex gap-2">
          <Link
            href={`/draft?rep=${rep.slug}&mode=letter`}
            className="flex-1 no-underline"
          >
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-all active:scale-[0.98] shadow-sm">
              <Mail className="w-4 h-4" />
              Write Letter
            </button>
          </Link>
          <Link
            href={`/draft?rep=${rep.slug}&mode=call`}
            className="no-underline"
          >
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-navy text-sm font-semibold rounded-xl border border-gray-200 hover:border-navy hover:bg-navy-50 transition-all active:scale-[0.98]">
              <Phone className="w-4 h-4" />
              Call
            </button>
          </Link>
          <Link
            href={`/draft?rep=${rep.slug}&mode=social`}
            className="no-underline"
          >
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-navy text-sm font-semibold rounded-xl border border-gray-200 hover:border-teal hover:bg-teal-50 transition-all active:scale-[0.98]">
              <PenLine className="w-4 h-4" />
              Email
            </button>
          </Link>
        </div>

        {/* ── Save Button (for lookup results) ── */}
        {showSaveButton && onSave && (
          <button
            onClick={onSave}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-600 transition-all active:scale-[0.98] shadow-sm"
          >
            <BookmarkPlus className="w-4 h-4" />
            Save as My Rep
          </button>
        )}

        {/* ── Expand/Collapse Toggle ── */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-400 hover:text-navy rounded-lg hover:bg-gray-50 transition-colors"
        >
          {expanded ? (
            <>Less detail <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>More detail <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>

        {/* ── Expanded Detail Section ── */}
        {expanded && (
          <div className="mt-2 space-y-4 animate-in slide-in-from-top-2 duration-300">
            {enriching && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading detailed data...
              </div>
            )}

            {/* Committees */}
            {rep.committees.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gold-dark" />
                  Committees
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {rep.committees.map((c) => (
                    <span key={c} className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-lg">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Votes */}
            {enrichedRep.keyVotes && enrichedRep.keyVotes.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-gold-dark" />
                  Key Votes
                </h4>
                <div className="space-y-2">
                  {enrichedRep.keyVotes.slice(0, 4).map((v, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px]">
                      <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        v.vote === "YEA" ? "bg-green-light text-green" :
                        v.vote === "NAY" ? "bg-red-light text-red" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {v.vote}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-navy font-medium">{v.title}</span>
                        {v.brokeWithParty && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-gold-dark font-semibold">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Broke with party
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interest Group Ratings */}
            {enrichedRep.interestGroupRatings && enrichedRep.interestGroupRatings.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">
                  Interest Group Ratings
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {enrichedRep.interestGroupRatings.slice(0, 6).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50">
                      <span className="text-sm">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-gray-600 truncate">{r.group}</div>
                        <div className="text-[11px] font-bold text-navy">{r.score}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Profile Link */}
            <Link
              href={`/directory/${rep.slug}`}
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gold-dark hover:text-navy transition-colors no-underline"
            >
              View Full Profile
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}

/** Build a concise summary sentence from representative data */
function buildSummary(rep: Representative): string {
  const parts: string[] = [];

  // Identity
  const termLabel = rep.chamber === "Senate" ? "Senator" : "Representative";
  parts.push(`${rep.fullName} is a ${partyConfig[rep.party]?.label || "Independent"} ${termLabel} from ${rep.state}.`);

  // Loyalty & activity
  if (rep.partyLoyalty > 0) {
    const loyaltyDesc = rep.partyLoyalty >= 95 ? "a strong party loyalist"
      : rep.partyLoyalty >= 85 ? "generally aligned with their party"
      : rep.partyLoyalty >= 70 ? "moderate within their party"
      : "known for crossing party lines";
    parts.push(`They are ${loyaltyDesc} (${rep.partyLoyalty}% party vote alignment).`);
  }

  // Bills
  if (rep.billsIntroduced > 0) {
    parts.push(`They have introduced ${rep.billsIntroduced} bill${rep.billsIntroduced !== 1 ? "s" : ""}, with ${rep.billsEnacted} enacted into law.`);
  }

  // Committees
  if (rep.committees.length > 0) {
    const topCommittees = rep.committees.slice(0, 2).join(" and ");
    parts.push(`They serve on ${rep.committees.length} committee${rep.committees.length !== 1 ? "s" : ""} including ${topCommittees}.`);
  }

  return parts.join(" ");
}

