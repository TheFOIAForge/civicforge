const FOIAFORGE_URL = "https://www.thefoiaforge.org";

export default function EcosystemBar() {
  return (
    <div className="bg-[#1a1a2e] text-white/70 text-center">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 h-10">
        <span className="font-mono text-xs tracking-widest text-white/30 hidden sm:inline mr-3">
          FOIAFORGE ECOSYSTEM
        </span>
        <a
          href={FOIAFORGE_URL}
          className="px-4 py-1 font-mono text-xs font-bold tracking-wider no-underline text-white/50 hover:text-white transition-colors"
        >
          FOIA FORGE
        </a>
        <span className="text-white/20 font-mono text-sm">|</span>
        <span className="px-4 py-1 font-mono text-xs font-bold tracking-wider text-white border-b-2 border-red">
          CITIZENFORGE
        </span>
      </div>
    </div>
  );
}
