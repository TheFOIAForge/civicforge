import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });

export async function GET(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const dataParam = request.nextUrl.searchParams.get("data");

  if (!dataParam) {
    return NextResponse.json({ error: "Missing data parameter" }, { status: 400 });
  }

  try {
    const entries = JSON.parse(decodeURIComponent(dataParam)) as Array<{
      date: string;
      repName: string;
      method: string;
      issue: string;
      status: string;
      notes: string;
    }>;

    const headers = ["Date", "Representative", "Method", "Issue", "Status", "Notes"];
    const csvRows = [headers.join(",")];

    for (const entry of entries) {
      const row = [
        entry.date,
        entry.repName,
        entry.method,
        entry.issue,
        entry.status,
        entry.notes,
      ].map((field) => {
        const escaped = String(field ?? "").replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(row.join(","));
    }

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="checkmyrep-contacts.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
