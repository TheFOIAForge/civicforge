const FOIAFORGE_URL = "https://www.thefoiaforge.org";

export default function EcosystemBar() {
  return (
    <div style={{ backgroundColor: "#1a1a1a", borderBottom: "2px solid #c4a44a" }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 h-10">
        <span className="font-mono text-xs tracking-widest hidden sm:inline mr-3" style={{ color: "#5a5a5a" }}>
          FOIAFORGE ECOSYSTEM
        </span>
        <a
          href={FOIAFORGE_URL}
          className="px-4 py-1 font-mono text-xs font-bold tracking-wider no-underline transition-colors"
          style={{ color: "#8a8a8a" }}
        >
          FOIA FORGE
        </a>
        <span className="font-mono text-sm" style={{ color: "#c4a44a" }}>&#9733;</span>
        <span className="px-4 py-1 font-mono text-xs font-bold tracking-wider" style={{ color: "#f5e6c8", borderBottom: "2px solid #C1272D" }}>
          CHECKMYREP
        </span>
      </div>
    </div>
  );
}
