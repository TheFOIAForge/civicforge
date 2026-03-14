const FOIAFORGE_URL = "https://www.thefoiaforge.org";

export default function EcosystemBar() {
  return (
    <div style={{ backgroundColor: "#0A2540", borderBottom: "1px solid #E5E5E5" }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 h-10">
        <span className="font-mono text-xs tracking-widest hidden sm:inline mr-3" style={{ color: "#4B5563" }}>
          FOIAFORGE ECOSYSTEM
        </span>
        <a
          href={FOIAFORGE_URL}
          className="px-4 py-1 font-mono text-xs font-bold tracking-wider no-underline transition-colors"
          style={{ color: "#9CA3AF" }}
        >
          FOIA FORGE
        </a>
        <span className="font-mono text-sm" style={{ color: "#C9A66B" }}>&#9733;</span>
        <span className="px-4 py-1 font-mono text-xs font-bold tracking-wider" style={{ color: "#F8F7F4", borderBottom: "1px solid #E5E5E5" }}>
          CHECKMYREP
        </span>
      </div>
    </div>
  );
}
