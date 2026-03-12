import Link from "next/link";

const navLinks = [
  { href: "/directory", label: "Members of Congress" },
  { href: "/issues", label: "Key Issues" },
  { href: "/draft", label: "Write Congress" },
  { href: "/federal-register", label: "Federal Register" },
  { href: "/gao-reports", label: "Oversight Reports" },
];

const toolLinks = [
  { href: "/mind-palace", label: "Mind Palace AI" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/contacts", label: "My Letters" },
  { href: "/settings", label: "Settings & API Keys" },
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
          <div className="md:col-span-1">
            <Link href="/" className="no-underline">
              <span className="font-headline text-3xl uppercase text-white">
                Civic<span className="text-red">Forge</span>
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

          {/* Navigate */}
          <div>
            <h4 className="font-mono text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Navigate
            </h4>
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
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

          {/* Tools */}
          <div>
            <h4 className="font-mono text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Tools
            </h4>
            <div className="flex flex-col gap-2">
              {toolLinks.map((link) => (
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

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-white/40">
            &copy; {new Date().getFullYear()} CivicForge. All data is publicly sourced.
          </p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-white/40">
              BYOK &mdash; Your API keys stay in your browser
            </span>
            <span className="inline-block w-2 h-2 bg-green animate-pulse" title="Open source" />
          </div>
        </div>
      </div>
    </footer>
  );
}
