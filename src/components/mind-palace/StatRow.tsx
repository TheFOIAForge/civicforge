import type { StatItem } from "@/lib/mind-palace/block-parser";

const colorMap: Record<string, string> = {
  red: "text-red",
  green: "text-green",
  black: "text-black",
  dem: "text-dem",
  rep: "text-rep",
  ind: "text-yellow-600",
};

export default function StatRow({ stats }: { stats: StatItem[] }) {
  return (
    <div className={`grid gap-3 my-4 ${stats.length <= 2 ? "grid-cols-2" : stats.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
      {stats.map((stat, i) => (
        <div key={i} className="border-3 border-border p-4 bg-surface text-center">
          <div className={`font-headline text-2xl md:text-3xl ${colorMap[stat.color || "black"] || "text-black"}`}>
            {stat.value}
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-gray-mid mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
