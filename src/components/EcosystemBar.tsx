const FOIAFORGE_URL = "https://www.thefoiaforge.org";

export default function EcosystemBar() {
  return (
    <div className="bg-[#1a1a2e] text-white/70 text-center">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-1 h-7">
        <span className="font-mono text-[10px] tracking-widest text-white/30 hidden sm:inline mr-2">
          FOIAFORGE ECOSYSTEM
        </span>
        <a
          href={FOIAFORGE_URL}
          className="px-3 py-0.5 font-mono text-[10px] font-bold tracking-wider no-underline text-white/50 hover:text-white transition-colors"
        >
          FOIA FORGE
        </a>
        <span className="text-white/20 font-mono text-[10px]">|</span>
        <span className="px-3 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white border-b border-red">
          CIVICFORGE
        </span>
      </div>
    </div>
  );
}
