"use client";

import Link from "next/link";

const SUPPORT_PLATFORMS = [
  {
    name: "Buy Me a Coffee",
    url: "", // TODO: Set up at https://www.buymeacoffee.com
    icon: "☕",
    color: "bg-[#FFDD00] text-black",
    borderColor: "border-[#FFDD00]",
    description:
      "Quick one-time tips. No account needed for supporters. Great for casual \"thanks for building this\" donations.",
    setupUrl: "https://www.buymeacoffee.com",
    features: ["One-time tips", "No sign-up for tippers", "Embed widget on site", "Free to set up"],
  },
  {
    name: "Ko-fi",
    url: "", // TODO: Set up at https://ko-fi.com
    icon: "❤️",
    color: "bg-[#FF5E5B] text-white",
    borderColor: "border-[#FF5E5B]",
    description:
      "Similar to Buy Me a Coffee but takes 0% platform fee on donations. Also supports monthly memberships and a shop.",
    setupUrl: "https://ko-fi.com",
    features: ["0% platform fee", "Monthly memberships", "One-time donations", "Shop for extras"],
  },
  {
    name: "GitHub Sponsors",
    url: "", // TODO: Set up at https://github.com/sponsors
    icon: "💜",
    color: "bg-[#6e40c9] text-white",
    borderColor: "border-[#6e40c9]",
    description:
      "Best for developer-oriented supporters. GitHub matches sponsorships in the first year. Monthly tiers available.",
    setupUrl: "https://github.com/sponsors",
    features: ["GitHub matches first year", "Monthly tiers", "Developer audience", "No platform fee"],
  },
  {
    name: "Open Collective",
    url: "", // TODO: Set up at https://opencollective.com
    icon: "🌐",
    color: "bg-[#297EFF] text-white",
    borderColor: "border-[#297EFF]",
    description:
      "Fully transparent finances — every donation and expense is public. Perfect for a civic accountability project. Can accept as a nonprofit.",
    setupUrl: "https://opencollective.com",
    features: ["Full financial transparency", "Nonprofit fiscal hosting", "Tax-deductible option", "Public expense reports"],
  },
  {
    name: "Patreon",
    url: "", // TODO: Set up at https://www.patreon.com
    icon: "🎨",
    color: "bg-[#FF424D] text-white",
    borderColor: "border-[#FF424D]",
    description:
      "Recurring monthly support with membership tiers. Good for building a community of dedicated supporters with exclusive updates.",
    setupUrl: "https://www.patreon.com",
    features: ["Monthly recurring", "Membership tiers", "Community features", "Exclusive updates"],
  },
  {
    name: "Liberapay",
    url: "", // TODO: Set up at https://liberapay.com
    icon: "🔄",
    color: "bg-[#F6C915] text-black",
    borderColor: "border-[#F6C915]",
    description:
      "Open-source recurring donation platform. No platform fee — only payment processor fees. Built for public-interest projects.",
    setupUrl: "https://liberapay.com",
    features: ["No platform fee", "Open source itself", "Recurring donations", "Public-interest focused"],
  },
];

export default function SupportPage() {
  const hasAnyLinks = SUPPORT_PLATFORMS.some((p) => p.url);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Support This Project</h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        CHECKMYREP IS FREE AND ALWAYS WILL BE. BUT IF YOU FIND IT USEFUL, YOU CAN HELP KEEP IT RUNNING.
      </p>

      {/* Mission statement */}
      <section className="border-3 border-border bg-surface p-6 md:p-8 mb-8">
        <h2 className="font-headline text-2xl mb-3">Why CheckMyRep Is Free</h2>
        <p className="font-body text-base text-gray-mid leading-relaxed mb-4">
          Government accountability shouldn&apos;t be behind a paywall. CheckMyRep uses
          publicly funded data sources — Congress.gov, the Federal Register, GovInfo,
          OpenFEC — because this information belongs to all of us. The AI features use
          a bring-your-own-key model so there are no recurring server costs for AI.
        </p>
        <p className="font-body text-base text-gray-mid leading-relaxed mb-4">
          That said, hosting, domain registration, API development, and the hundreds of
          hours building this platform aren&apos;t free. If CheckMyRep has helped you
          research a representative, draft a letter, submit a public comment, or just
          understand how government works — consider leaving a tip.
        </p>
        <div className="border-2 border-red bg-cream-dark p-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">🏛️</span>
          <div>
            <p className="font-headline text-lg normal-case mb-1">100% goes to keeping this running</p>
            <p className="font-body text-sm text-gray-mid">
              Every dollar goes directly to hosting costs, API fees, and development time.
              CheckMyRep is a project of{" "}
              <a
                href="https://www.thefoiaforge.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red font-bold no-underline hover:text-black transition-colors"
              >
                FOIAForge
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* What your support covers */}
      <section className="mb-8">
        <h2 className="font-headline text-2xl mb-4">What Your Support Covers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "🖥️", label: "Hosting & Infrastructure", detail: "Servers, CDN, database, domain" },
            { icon: "📡", label: "API Access", detail: "Congress.gov, GovInfo, FEC data feeds" },
            { icon: "🛠️", label: "Development", detail: "New features, bug fixes, maintenance" },
            { icon: "📱", label: "Mobile App", detail: "iOS and Android app development" },
          ].map((item) => (
            <div key={item.label} className="border-2 border-border p-4 bg-cream-dark text-center">
              <span className="text-3xl block mb-2">{item.icon}</span>
              <h3 className="font-headline text-base normal-case mb-1">{item.label}</h3>
              <p className="font-mono text-[10px] text-gray-mid font-bold">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Setup status banner */}
      {!hasAnyLinks && (
        <div className="border-3 border-red bg-red/10 p-5 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🚧</span>
            <div>
              <h3 className="font-headline text-lg normal-case mb-1">Donation Links Coming Soon</h3>
              <p className="font-body text-sm text-gray-mid leading-relaxed">
                Support platforms are being set up. In the meantime, the best way to support
                CheckMyRep is to <strong>share it with others</strong>, <strong>use it to contact your reps</strong>,
                and <strong>spread the word</strong> about government accountability.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Platform cards */}
      <section className="mb-8">
        <h2 className="font-headline text-2xl mb-2">Ways to Support</h2>
        <p className="font-body text-sm text-gray-mid mb-6">
          Choose whatever platform works best for you. Every contribution — no matter how small — helps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUPPORT_PLATFORMS.map((platform) => (
            <div
              key={platform.name}
              className={`border-3 border-border bg-surface overflow-hidden ${
                platform.url ? "" : "opacity-80"
              }`}
            >
              {/* Color bar */}
              <div className={`h-2 ${platform.color}`} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-headline text-xl normal-case">{platform.name}</h3>
                    {!platform.url && (
                      <span className="font-mono text-[10px] font-bold text-gray-mid">NOT YET SET UP</span>
                    )}
                  </div>
                  {platform.url ? (
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 font-mono text-xs font-bold no-underline transition-opacity hover:opacity-80 ${platform.color}`}
                    >
                      SUPPORT
                    </a>
                  ) : (
                    <span className="px-4 py-2 font-mono text-xs font-bold bg-gray-light text-gray-mid border border-border">
                      COMING SOON
                    </span>
                  )}
                </div>

                <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
                  {platform.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {platform.features.map((f) => (
                    <span
                      key={f}
                      className={`px-2 py-1 font-mono text-[10px] font-bold border ${
                        platform.url
                          ? `${platform.borderColor} text-gray-dark`
                          : "border-border-light text-gray-mid"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {!platform.url && (
                  <p className="font-mono text-[10px] text-gray-mid mt-3">
                    Set up at:{" "}
                    <a
                      href={platform.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red no-underline hover:text-black transition-colors"
                    >
                      {platform.setupUrl.replace("https://", "")}
                    </a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended picks */}
      <section className="border-3 border-border bg-cream-dark p-6 mb-8">
        <h2 className="font-headline text-xl normal-case mb-3">Our Recommendations</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="font-headline text-lg text-red shrink-0">1.</span>
            <div>
              <p className="font-body text-sm font-bold">Open Collective — Best for transparency</p>
              <p className="font-body text-sm text-gray-mid">
                Every donation and expense is public. Perfect alignment with a civic accountability project.
                Can apply for nonprofit fiscal hosting for tax-deductible donations.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-headline text-lg text-red shrink-0">2.</span>
            <div>
              <p className="font-body text-sm font-bold">Ko-fi — Best for zero-fee tips</p>
              <p className="font-body text-sm text-gray-mid">
                0% platform fee means more of every dollar reaches you. Simple setup, no friction for supporters.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-headline text-lg text-red shrink-0">3.</span>
            <div>
              <p className="font-body text-sm font-bold">GitHub Sponsors — Best for developer supporters</p>
              <p className="font-body text-sm text-gray-mid">
                GitHub matches sponsorships in the first year (doubling donations). Great if your audience is technical.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Non-monetary support */}
      <section className="border-3 border-border bg-surface p-6 mb-8">
        <h2 className="font-headline text-2xl mb-2">Other Ways to Help</h2>
        <p className="font-body text-sm text-gray-mid mb-4">
          Don&apos;t have cash to spare? These are just as valuable:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border-2 border-border p-4 bg-cream-dark">
            <h3 className="font-headline text-lg normal-case mb-1">Share CheckMyRep</h3>
            <p className="font-body text-sm text-gray-mid leading-relaxed">
              Tell a friend, post on social media, or share in community groups. More users
              means more civic engagement.
            </p>
          </div>
          <div className="border-2 border-border p-4 bg-cream-dark">
            <h3 className="font-headline text-lg normal-case mb-1">Use It</h3>
            <p className="font-body text-sm text-gray-mid leading-relaxed">
              Write to your representative. Submit a public comment. Research a committee.
              The more people use this, the more it matters.
            </p>
          </div>
          <div className="border-2 border-border p-4 bg-cream-dark">
            <h3 className="font-headline text-lg normal-case mb-1">Report Bugs</h3>
            <p className="font-body text-sm text-gray-mid leading-relaxed">
              Found something broken? Data that looks wrong? Let us know so we can fix it.
              Quality matters for accountability tools.
            </p>
          </div>
          <div className="border-2 border-border p-4 bg-cream-dark">
            <h3 className="font-headline text-lg normal-case mb-1">Contribute Code</h3>
            <p className="font-body text-sm text-gray-mid leading-relaxed">
              CheckMyRep is open source. Developers can contribute features, fix bugs, or
              improve accessibility. Every PR helps.
            </p>
          </div>
        </div>
      </section>

      {/* Back to home */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-mono text-sm font-bold no-underline hover:bg-red transition-colors"
        >
          &larr; BACK TO CHECKMYREP
        </Link>
      </div>
    </div>
  );
}
