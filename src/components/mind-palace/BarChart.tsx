import type { BarChartData } from "@/lib/mind-palace/block-parser";

const bgMap: Record<string, string> = {
  red: "bg-red",
  green: "bg-green",
  black: "bg-black",
  dem: "bg-dem",
  rep: "bg-rep",
  ind: "bg-yellow-600",
};

function formatValue(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  if (v > 100) return `$${v.toLocaleString()}`;
  return String(v);
}

export default function BarChart({ data }: { data: BarChartData }) {
  const maxVal = Math.max(...data.bars.map((b) => b.value), 1);

  return (
    <div className="border-3 border-border p-4 bg-surface my-4">
      {data.title && (
        <h4 className="font-headline text-base uppercase mb-3">{data.title}</h4>
      )}
      <div className="space-y-2">
        {data.bars.map((bar, i) => {
          const pct = Math.max((bar.value / maxVal) * 100, 2);
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-32 md:w-40 shrink-0 font-mono text-xs text-right truncate">
                {bar.label}
              </div>
              <div className="flex-1 h-6 bg-cream border border-border relative">
                <div
                  className={`h-full ${bgMap[bar.color || "black"] || "bg-black"} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-16 shrink-0 font-mono text-xs font-bold text-right">
                {formatValue(bar.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
