const FOIAFORGE_URL = "https://www.thefoiaforge.org";

export default function EcosystemBar() {
  return (
    <div className="bg-gray-100 text-gray-500 text-center">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 h-10">
        <span className="font-mono text-xs tracking-widest text-gray-400 hidden sm:inline mr-3">
          FOIAFORGE ECOSYSTEM
        </span>
        <a
          href={FOIAFORGE_URL}
          className="px-4 py-1 font-mono text-xs font-bold tracking-wider no-underline text-gray-500 hover:text-gray-800 transition-colors"
        >
          FOIA FORGE
        </a>
        <span className="text-gray-300 font-mono text-sm">|</span>
        <span className="px-4 py-1 font-mono text-xs font-bold tracking-wider text-gray-900 border-b-2 border-red">
          CHECKMYREP
        </span>
      </div>
    </div>
  );
}
