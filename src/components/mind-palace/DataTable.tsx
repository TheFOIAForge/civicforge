import type { TableData } from "@/lib/mind-palace/block-parser";

export default function DataTable({ data }: { data: TableData }) {
  return (
    <div className="border-3 border-border my-4 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-black text-white">
            {data.headers.map((h, i) => (
              <th key={i} className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-left font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-surface" : "bg-cream"}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 font-mono text-xs border-t border-border">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
