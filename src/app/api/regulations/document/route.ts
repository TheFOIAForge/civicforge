import { NextRequest, NextResponse } from "next/server";

const REGULATIONS_API = "https://api.regulations.gov/v4/documents";

export async function GET(request: NextRequest) {
  const apiKey = process.env.REGULATIONS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "REGULATIONS_GOV_API_KEY is not configured. Get a free API key at https://open.gsa.gov/api/regulationsgov/ and add it to your .env.local file.",
      },
      { status: 500 }
    );
  }

  const documentId = request.nextUrl.searchParams.get("documentId");
  if (!documentId) {
    return NextResponse.json(
      { error: "Missing required query parameter: documentId" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${REGULATIONS_API}/${documentId}`, {
      headers: {
        "X-Api-Key": apiKey,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (errData as any)?.errors?.[0]?.detail ||
        `Regulations.gov API returned status ${res.status}`;
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const data = await res.json();
    const attrs = data?.data?.attributes || {};

    return NextResponse.json({
      documentId: data?.data?.id || documentId,
      title: attrs.title || "",
      commentStartDate: attrs.commentStartDate || null,
      commentEndDate: attrs.commentEndDate || null,
      agencyId: attrs.agencyId || "",
      docketId: attrs.docketId || "",
      documentType: attrs.documentType || "",
      frDocNum: attrs.frDocNum || "",
      objectId: attrs.objectId || "",
    });
  } catch (err) {
    console.error("Regulations.gov document fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch document from Regulations.gov." },
      { status: 500 }
    );
  }
}
