import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-3 border-red bg-black text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <span className="font-headline text-2xl uppercase">
              Civic<span className="text-red">Forge</span>
            </span>
            <p className="mt-3 text-base text-white/70 font-body">
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
          <div>
            <h4 className="font-headline text-base mb-4 text-white">Navigate</h4>
            <div className="flex flex-col gap-2">
              <Link href="/directory" className="text-base text-white/70 hover:text-white no-underline font-mono font-bold">Explore Congress</Link>
              <Link href="/issues" className="text-base text-white/70 hover:text-white no-underline font-mono font-bold">Issues</Link>
              <Link href="/draft" className="text-base text-white/70 hover:text-white no-underline font-mono font-bold">Take Action</Link>
              <Link href="/campaigns" className="text-base text-white/70 hover:text-white no-underline font-mono font-bold">Campaigns</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t-2 border-white/10 text-center">
          <p className="font-mono text-sm text-white/50">
            All data is publicly sourced. CivicForge stores nothing on servers. Your data stays in your browser.
          </p>
        </div>
      </div>
    </footer>
  );
}
