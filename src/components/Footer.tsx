import Link from "next/link";

const researchLinks = [
  { href: "/directory", label: "Members of Congress" },
  { href: "/committees", label: "Committees" },
  { href: "/bills", label: "Legislation" },
  { href: "/issues", label: "Key Issues" },
  { href: "/votes", label: "Vote Lookup" },
  { href: "/compare", label: "Compare Reps" },
];

const watchdogLinks = [
  { href: "/federal-register", label: "Federal Register" },
  { href: "/gao-reports", label: "GAO Oversight" },
];

const actionLinks = [
  { href: "/mind-palace", label: "Mind Palace AI" },
  { href: "/my-reps", label: "My Representatives" },
  { href: "/draft", label: "Write Congress" },
  { href: "/contacts", label: "My Letters" },
  { href: "/campaigns", label: "My Campaigns" },
  { href: "/alerts", label: "Alerts" },
  { href: "/settings", label: "Settings" },
];

const foiaLinks = [
  { href: "https://www.thefoiaforge.org/new-request", label: "File a Request" },
  { href: "https://www.thefoiaforge.org/my-cases", label: "My FOIA Cases" },
  { href: "https://www.thefoiaforge.org/agencies", label: "Agency Directory" },
];

const dataSources = [
  { name: "Congress.gov", url: "https://api.congress.gov" },
  { name: "OpenFEC", url: "https://api.open.fec.gov" },
  { name: "Voteview (UCLA)", url: "https://voteview.com" },
  { name: "Senate LDA", url: "https://lda.senate.gov" },
  { name: "Federal Register", url: "https://www.federalregister.gov" },
  { name: "GovInfo / GAO", url: "https://api.govinfo.gov" },
  { name: "ProPublica Nonprofits", url: "https://projects.propublica.org/nonprofits" },
  { name: "USAspending", url: "https://api.usaspending.gov" },
];

export default function Footer() {
  return (
    <footer className="border-t-3 border-red bg-black text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="no-underline">
              <span className="font-headline text-3xl uppercase text-white">
                Check<span className="text-red">My</span>Rep
              </span>
            </Link>
            <p className="mt-3 text-sm text-white/60 font-body leading-relaxed">
              Government accountability and civic engagement. Research your
              representatives, follow the money, and make your voice heard.
            </p>
            <p className="mt-4 text-sm text-white/60 font-body">
              A project of{" "}
              <a
                href="https://www.thefoiaforge.org"
                className="text-red hover:text-white no-underline font-bold"
                target="_blank"
                rel="noopener noreferrer"
              >
                FOIAForge
              </a>
            </p>
          </div>

          {/* Research + Watchdog */}
          <div>
            <h4 className="font-mono text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Research
            </h4>
            <div className="flex flex-col gap-2">
              {researchLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/70 hover:text-white no-underline font-mono font-bold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <h4 className="font-mono text-xs font-bold text-white/40 uppercase tracking-widest mb-3 mt-6">
              Watchdog
            </h4>
            <div className="flex flex-col gap-2">
              {watchdogLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/70 hover:text-white no-underline font-mono font-bold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Take Action + Records (FOIA) */}
          <div>
            <h4 className="font-mono text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Take Action
            </h4>
            <div className="flex flex-col gap-2">
              {actionLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/70 hover:text-white no-underline font-mono font-bold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <h4 className="font-mono text-xs font-bold text-white/40 uppercase tracking-widest mb-3 mt-6">
              Records (FOIA)
            </h4>
            <div className="flex flex-col gap-2">
              {foiaLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white no-underline font-mono font-bold transition-colors inline-flex items-center gap-1"
                >
                  {link.label}
                  <svg width="10" height="10" className="text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="font-mono text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Data Sources
            </h4>
            <div className="flex flex-col gap-1.5">
              {dataSources.map((src) => (
                <a
                  key={src.name}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/50 hover:text-white/80 no-underline font-mono transition-colors"
                >
                  {src.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Support CTA */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <p className="font-mono text-xs text-white/60 font-bold mb-1">
                CHECKMYREP IS FREE AND OPEN SOURCE
              </p>
              <p className="font-body text-sm text-white/40">
                If this tool has helped you engage with your government, consider supporting the project.
              </p>
            </div>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red text-white font-mono text-xs font-bold no-underline hover:bg-white hover:text-black transition-colors shrink-0"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              SUPPORT THIS PROJECT
            </Link>
          </div>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-mono text-xs text-white/40">
              &copy; {new Date().getFullYear()} CheckMyRep. All data is publicly sourced.
            </p>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-white/40">
                BYOK &mdash; Your API keys stay in your browser
              </span>
              <span className="inline-block w-2 h-2 bg-green motion-safe:animate-pulse" title="Open source" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
