import type { ProgressBarData } from "@/lib/mind-palace/block-parser";

const bgMap: Record<string, string> = {
  red: "bg-red",
  green: "bg-green",
  black: "bg-black",
  dem: "bg-dem",
  rep: "bg-rep",
  ind: "bg-yellow-600",
};

export default function ProgressBarViz({ data }: { data: ProgressBarData }) {
  const pct = Math.min((data.value / data.max) * 100, 100);

  return (
    <div className="my-4">
      <div className="flex justify-between mb-1">
        <span className="font-mono text-xs uppercase tracking-wider font-bold">{data.label}</span>
        <span className="font-mono text-xs font-bold">{data.value}%</span>
      </div>
      <div className="h-6 border-2 border-border bg-cream">
        <div
          className={`h-full ${bgMap[data.color || "black"] || "bg-black"} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
