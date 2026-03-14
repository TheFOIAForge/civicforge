import { NextRequest, NextResponse } from "next/server";
import { regulationsCommentSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

const REGULATIONS_API = "https://api.regulations.gov/v4/comments";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });

export async function POST(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const apiKey = process.env.REGULATIONS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Regulations.gov API not configured" },
      { status: 503 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = parseBody(regulationsCommentSchema, raw);
  if (!parsed.success) return parsed.response;

  const { documentId, comment, firstName, lastName, email } = parsed.data;

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
