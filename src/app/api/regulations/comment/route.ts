import { NextRequest, NextResponse } from "next/server";

const REGULATIONS_API = "https://api.regulations.gov/v4/comments";

interface CommentRequest {
  documentId: string;
  comment: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function POST(request: NextRequest) {
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

  let body: CommentRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { documentId, comment, firstName, lastName, email } = body;

  if (!documentId || !comment || !firstName || !lastName || !email) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: documentId, comment, firstName, lastName, email.",
      },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(REGULATIONS_API, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "comments",
          attributes: {
            commentOnDocumentId: documentId,
            comment,
            firstName,
            lastName,
            email,
          },
        },
      }),
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
    const trackingNumber =
      data?.data?.attributes?.trackingNumber ||
      data?.data?.id ||
      "submitted";

    return NextResponse.json({ trackingNumber });
  } catch (err) {
    console.error("Regulations.gov comment submission error:", err);
    return NextResponse.json(
      { error: "Failed to submit comment to Regulations.gov. Please try again." },
      { status: 500 }
    );
  }
}
