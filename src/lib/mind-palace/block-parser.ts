export type BlockType = "text" | "stat-row" | "bar-chart" | "table" | "progress-bar" | "timeline" | "money-flow";

export interface StatItem {
  label: string;
  value: string;
  color?: string;
}

export interface BarChartData {
  title: string;
  bars: { label: string; value: number; color?: string }[];
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ProgressBarData {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
}

export interface ParsedBlock {
  type: BlockType;
  content: string | StatItem[] | BarChartData | TableData | ProgressBarData | TimelineEvent[];
}

export function parseBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const parts = text.split(/:::/);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Check if this part starts with a block type identifier
    const blockTypeMatch = part.match(/^(stat-row|bar-chart|table|progress-bar|timeline|money-flow)\s*\n([\s\S]*)/);

    if (blockTypeMatch) {
      const type = blockTypeMatch[1] as BlockType;
      const jsonStr = blockTypeMatch[2].trim();
      try {
        const data = JSON.parse(jsonStr);
        blocks.push({ type, content: data });
      } catch {
        // If JSON parse fails, render as text
        blocks.push({ type: "text", content: part });
      }
    } else {
      // Regular text block
      if (part.length > 0) {
        blocks.push({ type: "text", content: part });
      }
    }
  }

  return blocks;
}
