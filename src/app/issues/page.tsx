"use client";

import Link from "next/link";
import { issues } from "@/data/issues";
import Card from "@/components/ui/Card";
import {
  Heart,
  Globe,
  Home as HomeIcon,
  Plane,
  GraduationCap,
  TrendingUp,
  Users,
  Swords,
  Phone,
  Mail,
  PenLine,
  ArrowRight,
  Star,
} from "lucide-react";

const issueIcons: Record<string, React.ReactNode> = {
  healthcare: <Heart className="w-6 h-6" />,
  environment: <Globe className="w-6 h-6" />,
  housing: <HomeIcon className="w-6 h-6" />,
  immigration: <Plane className="w-6 h-6" />,
  education: <GraduationCap className="w-6 h-6" />,
  economy: <TrendingUp className="w-6 h-6" />,
  "civil-rights": <Users className="w-6 h-6" />,
  defense: <Swords className="w-6 h-6" />,
};

const issueColors: Record<string, { bg: string; text: string; accent: string }> = {
  healthcare: { bg: "bg-red-50", text: "text-red", accent: "bg-red" },
  environment: { bg: "bg-teal-50", text: "text-teal", accent: "bg-teal" },
  housing: { bg: "bg-yellow-light", text: "text-yellow", accent: "bg-yellow" },
  immigration: { bg: "bg-blue-light", text: "text-blue", accent: "bg-blue" },
  education: { bg: "bg-purple-50", text: "text-purple-600", accent: "bg-purple-600" },
  economy: { bg: "bg-gold-50", text: "text-gold-dark", accent: "bg-gold-dark" },
  "civil-rights": { bg: "bg-gray-100", text: "text-gray-700", accent: "bg-gray-700" },
  defense: { bg: "bg-navy-50", text: "text-navy", accent: "bg-navy" },
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="flex items-start gap-4">
          <img src="/images/civic/icons/voter-guide.png" alt="" className="w-10 h-10 mt-1 opacity-80" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-teal uppercase tracking-wider mb-1">
              Explore topics
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-navy">
              The Issues
            </h1>
            <p className="text-gray-500 mt-2">
              Real numbers. Real stakes. Pick an issue and take action.
            </p>
          </div>
        </div>
      </div>

      {/* Issues grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {issues.map((issue) => {
          const colors = issueColors[issue.id] || issueColors.defense;
          const icon = issueIcons[issue.id] || <Star className="w-6 h-6" />;
          const stat = issueStat[issue.id];
          return (
            <Link
              key={issue.id}
              href={`/issues/${issue.slug}`}
              className="group no-underline"
            >
              <Card hover padding="none" className="overflow-hidden h-full">
                <div className={`h-1 ${colors.accent}`} />
                <div className="p-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4
                    ${colors.bg} ${colors.text} group-hover:scale-110 transition-transform`}>
                    {icon}
                  </div>
                  <h2 className="text-lg font-semibold text-navy mb-2">
                    {issue.name}
                  </h2>
                  {stat && (
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      {stat}
                    </p>
                  )}
                  <div className="flex items-center text-sm font-medium text-navy group-hover:text-gold-dark transition-colors">
                    Explore
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* How to make your voice heard */}
      <section>
        <div className="mb-6">
          <p className="text-sm font-semibold text-gold-dark uppercase tracking-wider mb-1">
            Take action
          </p>
          <h2 className="text-2xl font-bold text-navy">
            How to make your voice heard
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/draft?mode=call" className="group no-underline">
            <Card hover padding="md" className="h-full">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-50 mb-4">
                <img src="/images/civic/icons/contact.png" alt="" className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">When to Call</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Call when a bill is up for a vote or in committee. Phone calls are
                logged as constituent contacts and taken seriously. Call the DC
                office 9am-5pm ET.
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-navy group-hover:text-teal transition-colors">
                Start a call script
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/draft" className="group no-underline">
            <Card hover padding="md" className="h-full">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-navy-50 mb-4">
                <img src="/images/civic/icons/mail.png" alt="" className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">When to Write</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Write when you want to explain your position in detail or share a
                personal story. Physical letters carry more weight than emails and
                show serious commitment.
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-navy group-hover:text-teal transition-colors">
                Write a letter
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/draft?mode=social" className="group no-underline">
            <Card hover padding="md" className="h-full">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold-50 mb-4">
                <img src="/images/civic/icons/email.png" alt="" className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">When to Email</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Email when you want quick, convenient digital contact. Draft a
                professional email with AI assistance and send it directly to
                your representative&apos;s office.
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-navy group-hover:text-teal transition-colors">
                Draft an email
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Illustration */}
        <div className="mt-8 text-center">
          <img
            src="/images/civic/illustrations/vote-by-mail.png"
            alt="Civic engagement illustration"
            className="mx-auto w-48 opacity-60"
          />
          <p className="text-xs text-gray-400 mt-2">Your voice matters. Take action today.</p>
        </div>
      </section>
    </div>
  );
}
