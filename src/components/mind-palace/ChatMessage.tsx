import { parseBlocks, type ParsedBlock, type StatItem, type BarChartData, type TableData, type ProgressBarData, type TimelineEvent } from "@/lib/mind-palace/block-parser";
import StatRow from "./StatRow";
import BarChart from "./BarChart";
import DataTable from "./DataTable";
import ProgressBarViz from "./ProgressBarViz";
import Timeline from "./Timeline";

function RenderBlock({ block }: { block: ParsedBlock }) {
  switch (block.type) {
    case "stat-row":
      return <StatRow stats={block.content as StatItem[]} />;
    case "bar-chart":
      return <BarChart data={block.content as BarChartData} />;
    case "table":
      return <DataTable data={block.content as TableData} />;
    case "progress-bar":
      return <ProgressBarViz data={block.content as ProgressBarData} />;
    case "timeline":
      return <Timeline events={block.content as TimelineEvent[]} />;
    case "text":
    default:
      return (
        <div className="font-body text-base leading-relaxed whitespace-pre-wrap">
          {block.content as string}
        </div>
      );
  }
}

export default function ChatMessage({
  role,
  content,
  tokens,
}: {
  role: "user" | "assistant";
  content: string;
  tokens?: { input: number; output: number; cost: number };
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-2xl border-3 border-border bg-black text-white p-4">
          <p className="font-body text-base">{content}</p>
        </div>
      </div>
    );
  }

  const blocks = parseBlocks(content);

  return (
    <div className="mb-6">
      <div className="border-3 border-border bg-surface p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 font-mono text-xs font-bold bg-red text-white">
            MIND PALACE
          </span>
        </div>
        <div className="space-y-2">
          {blocks.map((block, i) => (
            <RenderBlock key={i} block={block} />
          ))}
        </div>
        {tokens && (
          <div className="mt-3 pt-2 border-t border-border font-mono text-xs text-gray-mid">
            ~${tokens.cost.toFixed(3)} | {tokens.input.toLocaleString()} in / {tokens.output.toLocaleString()} out
          </div>
        )}
      </div>
    </div>
  );
}
