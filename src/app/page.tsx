"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { issues } from "@/data/issues";
import type { Representative } from "@/data/types";
import { useMyReps } from "@/lib/my-reps-context";
import {
  Search,
  MapPin,
  PenLine,
  Phone,
  Mail,
  BookOpen,
  Users,
  ArrowRight,
  ChevronRight,
  Star,
  TrendingUp,
  Heart,
  GraduationCap,
  Globe,
  Home as HomeIcon,
  Plane,
  Swords,
  CheckCircle2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { RepScorecard } from "@/components/scorecard";

const issueIcons: Record<string, React.ReactNode> = {
  healthcare: <Heart className="w-5 h-5" />,
  environment: <Globe className="w-5 h-5" />,
  housing: <HomeIcon className="w-5 h-5" />,
  immigration: <Plane className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  economy: <TrendingUp className="w-5 h-5" />,
  "civil-rights": <Users className="w-5 h-5" />,
  defense: <Swords className="w-5 h-5" />,
};

const issueColors: Record<string, { bg: string; text: string; border: string }> = {
  healthcare: { bg: "bg-red-50", text: "text-red", border: "border-red/20" },
  environment: { bg: "bg-teal-50", text: "text-teal", border: "border-teal/20" },
  housing: { bg: "bg-yellow-light", text: "text-yellow", border: "border-yellow/20" },
  immigration: { bg: "bg-blue-light", text: "text-blue", border: "border-blue/20" },
  education: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  economy: { bg: "bg-gold-50", text: "text-gold-dark", border: "border-gold/20" },
  "civil-rights": { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  defense: { bg: "bg-navy-50", text: "text-navy", border: "border-navy/20" },
};

/** Intersection Observer hook for scroll animations */
function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0, rootMargin: "80px" },
      );

      const targets = el.querySelectorAll(
        ".animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-scale, .stagger-children",
      );
      targets.forEach((t) => observer.observe(t));

      (el as any).__scrollObserver = observer;
    }, 100);

    return () => {
      clearTimeout(timer);
      if ((el as any).__scrollObserver) {
        (el as any).__scrollObserver.disconnect();
      }
    };
  }, []);

  return containerRef;
}

export default function Home() {
  const [address, setAddress] = useState("");
  const [results, setResults] = useState<Representative[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const { myReps, saveRep, hasSavedReps } = useMyReps();
  const scrollRef = useScrollReveal();

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const input = address.trim();
    if (!input) return;
    setLookupLoading(true);
    fetch(`/api/lookup?address=${encodeURIComponent(input)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.length > 0 ? data : []);
        setLookupLoading(false);
      })
      .catch(() => {
        setResults([]);
        setLookupLoading(false);
      });
  }

  function handleSaveReps() {
    if (results) {
      results.forEach((rep) => saveRep(rep));
    }
  }

  return (
    <div ref={scrollRef}>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-hero">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 pattern-dots opacity-[0.05]" />
        {/* Capitol watermark */}
        <img
          src="/images/civic/icons/globe.png"
          alt=""
          className="absolute right-[-60px] top-[-40px] w-[300px] h-[300px] opacity-[0.06]"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          {/* Badge with capitol icon from forclaude */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur
              rounded-full text-sm text-white/80 mb-6"
            style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}
          >
            <img src="/images/civic/icons/capitol.png" alt="" className="w-5 h-5 opacity-90" aria-hidden="true" />
            <span>Free civic engagement platform</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]"
            style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}
          >
            Your direct line to{" "}
            <span className="text-gold">Congress</span>
          </h1>

          <p
            className="mt-5 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto"
            style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}
          >
            Find your representatives, write letters, send emails, or make
            calls — all in one place.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleLookup}
            role="search"
            aria-label="Find your representatives"
            className="mt-10 max-w-xl mx-auto"
            style={{ animation: "fadeInUp 0.6s ease-out 0.4s both" }}
          >
            <label htmlFor="address-lookup" className="sr-only">
              Enter your full address
            </label>
            <div className="relative flex flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="address-lookup"
                  type="search"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  className="w-full pl-12 pr-4 py-4 bg-white text-navy text-base rounded-xl sm:rounded-r-none
                    border-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="px-7 py-4 bg-gold text-navy font-semibold text-base rounded-xl sm:rounded-l-none
                  border-none cursor-pointer hover:bg-gold-dark hover:text-white transition-all shadow-lg"
              >
                Find My Reps
              </button>
            </div>
          </form>

          {/* Quick action buttons */}
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animation: "fadeInUp 0.6s ease-out 0.55s both" }}
          >
            <Link
              href="/draft"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur
                text-white text-sm font-medium rounded-xl no-underline
                border border-white/20 hover:bg-white/20 transition-all"
            >
              <PenLine className="w-4 h-4" />
              Contact Congress
            </Link>
            <Link
              href="/issues"
              className="inline-flex items-center gap-2 px-5 py-2.5
                text-white/70 text-sm font-medium rounded-xl no-underline
                hover:text-white hover:bg-white/10 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Browse Issues
            </Link>
          </div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60L1440 60L1440 0C1200 40 960 60 720 40C480 20 240 40 0 20L0 60Z" fill="var(--color-offwhite)" />
          </svg>
        </div>
      </section>

      {/* ═══ Lookup results ═══ */}
      {lookupLoading && (
        <section className="px-4 py-12" aria-live="polite" aria-busy="true">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-xl shadow-sm border border-gray-200">
              <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-navy font-medium">Looking up your representatives...</p>
            </div>
          </div>
        </section>
      )}

      {results && !lookupLoading && results.length === 0 && (
        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <Card padding="lg">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-navy">No representatives found</h3>
              <p className="mt-2 text-gray-500">
                Try entering a full address with ZIP code for the best results.
              </p>
            </Card>
          </div>
        </section>
      )}

      {results && !lookupLoading && results.length > 0 && (
        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-navy">Your Representatives</h2>
                <p className="text-sm text-gray-500 mt-1">{results.length} found for your address</p>
              </div>
              <Button onClick={handleSaveReps} variant="teal" icon={<CheckCircle2 className="w-4 h-4" />}>
                Save as My Reps
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {results.map((rep) => (
                <RepScorecard key={rep.id} rep={rep} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ My Reps (saved) ═══ */}
      {hasSavedReps && !results && (
        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6 animate-on-scroll">
              <div>
                <h2 className="text-2xl font-bold text-navy">My Representatives</h2>
                <p className="text-sm text-gray-500 mt-1">Your saved representatives</p>
              </div>
              <Link href="/draft">
                <Button variant="primary" icon={<PenLine className="w-4 h-4" />}>
                  Write to Them
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {myReps.map((rep) => (
                <RepScorecard key={rep.id} rep={rep} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Action Cards — How It Works ═══ */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-on-scroll">
            <p className="text-sm font-semibold text-gold-dark uppercase tracking-wider mb-2">
              Three ways to act
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy">
              Make your voice heard
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {[
              {
                title: "Mail a Letter",
                desc: "The most impactful way to reach your rep. We print, stamp, and deliver via USPS.",
                price: "$1.50",
                href: "/draft",
                Icon: Mail,
                color: "bg-navy",
                iconBg: "bg-navy-50 text-navy",
                civicIcon: "/images/civic/icons/mail.png",
              },
              {
                title: "Send an Email",
                desc: "Free and instant. Draft a professional email with AI assistance and send directly.",
                price: "Free",
                href: "/draft",
                Icon: PenLine,
                color: "bg-teal",
                iconBg: "bg-teal-50 text-teal",
                civicIcon: "/images/civic/icons/email.png",
              },
              {
                title: "Make a Call",
                desc: "Two minutes, 10x the impact of an email. We provide talking points and the number.",
                price: "Free",
                href: "/draft",
                Icon: Phone,
                color: "bg-gold-dark",
                iconBg: "bg-gold-50 text-gold-dark",
                civicIcon: "/images/civic/icons/contact.png",
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group no-underline"
              >
                <Card hover padding="none" className="overflow-hidden h-full">
                  <div className={`h-1.5 ${card.color}`} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg} overflow-hidden`}>
                        {card.civicIcon ? (
                          <img src={card.civicIcon} alt="" className="w-7 h-7 object-contain" aria-hidden="true" />
                        ) : (
                          <card.Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {card.price}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-navy group-hover:text-gold-dark transition-colors">
                      Get started
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Issues Grid ═══ */}
      <section className="px-4 sm:px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-on-scroll">
            <p className="text-sm font-semibold text-teal uppercase tracking-wider mb-2">
              Explore topics
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy">
              Issues that matter to you
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {issues.map((issue) => {
              const colors = issueColors[issue.id] || issueColors.defense;
              const icon = issueIcons[issue.id] || <Star className="w-5 h-5" />;
              return (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.slug}`}
                  className="group no-underline"
                >
                  <Card hover padding="none" className="overflow-hidden h-full">
                    <div className="p-5 flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${colors.bg} ${colors.text}
                        group-hover:scale-110 transition-transform`}>
                        {icon}
                      </div>
                      <h3 className="text-sm font-semibold text-navy leading-tight">
                        {issue.name}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-gray-300 mt-2 group-hover:text-gold-dark transition-colors" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="px-4 sm:px-6 py-16 bg-gradient-navy relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-[0.04]" />
        <Image
          src="/images/civic/illustrations/voter-witness.png"
          alt=""
          width={160} height={160}
          className="absolute right-[-30px] bottom-[-20px] w-40 opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center stagger-children">
          {[
            { number: "535", label: "Members of Congress" },
            { number: "100", label: "Senators" },
            { number: "435", label: "Representatives" },
            { number: "50", label: "States Covered" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl md:text-5xl font-bold text-gold">
                {stat.number}
              </div>
              <div className="text-sm text-white/60 mt-2 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Call to action split ═══ */}
      <section className="px-4 sm:px-6 py-16 animate-on-scroll">
        <div className="max-w-5xl mx-auto">
          <Card padding="none" className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left: Visual — with forclaude voting illustration */}
              <div className="bg-gradient-hero p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute inset-0 pattern-dots opacity-[0.06]" />
                {/* Forclaude illustration overlays */}
                <Image
                  src="/images/civic/illustrations/vote-by-mail.png"
                  alt=""
                  width={128} height={128}
                  className="absolute bottom-4 right-4 w-32 h-32 opacity-10"
                  aria-hidden="true"
                />
                <Image
                  src="/images/civic/illustrations/signature-sign.png"
                  alt=""
                  width={96} height={96}
                  className="absolute top-4 left-4 w-24 h-24 opacity-[0.07]"
                  aria-hidden="true"
                />
                <div className="relative z-10">
                  <img src="/images/civic/icons/contact.png" alt="" className="w-10 h-10 mb-4 opacity-90" aria-hidden="true" />
                  <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    Your rep is one phone call away
                  </h3>
                  <p className="mt-3 text-white/70">
                    A two-minute call has 10x the impact of an email. We give you
                    talking points and connect you directly.
                  </p>
                </div>
              </div>
              {/* Right: Action */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h3 className="text-xl font-semibold text-navy mb-3">
                  Ready to make a difference?
                </h3>
                <p className="text-gray-500 mb-6">
                  Whether it&apos;s a letter, email, or phone call — every contact
                  counts. Start now and hold your representatives accountable.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/draft">
                    <Button variant="primary" icon={<PenLine className="w-4 h-4" />}>
                      Write a Letter
                    </Button>
                  </Link>
                  <Link href="/draft">
                    <Button variant="outline" icon={<Phone className="w-4 h-4" />}>
                      Call Script
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="px-4 sm:px-6 py-20 text-center bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-[0.04]" />
        <Image
          src="/images/civic/illustrations/receive-ballot.png"
          alt=""
          width={144} height={144}
          className="absolute left-4 bottom-4 w-36 opacity-[0.08]"
          aria-hidden="true"
        />
        <Image
          src="/images/civic/illustrations/vote-by-dropbox.png"
          alt=""
          width={144} height={144}
          className="absolute right-4 top-4 w-36 opacity-[0.08]"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-xl mx-auto animate-on-scroll">
          <img src="/images/civic/icons/globe.png" alt="" className="w-12 h-12 mx-auto mb-4 opacity-90" aria-hidden="true" />
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Your voice.{" "}
            <span className="text-gold">Their vote.</span>
          </h2>
          <p className="mt-4 text-lg text-white/70 max-w-md mx-auto">
            Every letter, every call adds up. Make yours count.
          </p>
          <Link href="/draft" className="inline-block mt-8">
            <Button size="lg" variant="secondary" icon={<PenLine className="w-5 h-5" />}>
              Write Congress Now
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══ Trust bar ═══ */}
      <div className="py-5 px-4 bg-navy border-t border-white/10">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-6 sm:gap-8 flex-wrap text-sm">
          <span className="text-white/50">
            <strong className="text-gold font-semibold">535</strong> Members Tracked
          </span>
          <span className="text-white/20">|</span>
          <span className="text-white/50">
            <strong className="text-gold font-semibold">8</strong> Issues Covered
          </span>
          <span className="text-white/20">|</span>
          <span className="text-white/50">
            <strong className="text-gold font-semibold">100%</strong> Free &amp; Open
          </span>
        </div>
      </div>
    </div>
  );
}

