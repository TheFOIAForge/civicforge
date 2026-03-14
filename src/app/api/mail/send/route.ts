import { NextRequest, NextResponse } from "next/server";
import type { MailingAddress } from "@/data/types";
import { formatLetterHtml } from "@/lib/letter-template";
import { sendMailSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/api-auth";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });

export async function POST(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  // Require authentication for direct mail sending
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const lobKey = process.env.LOB_API_KEY;
    if (!lobKey) {
      return NextResponse.json(
        { error: "Mail service not configured" },
        { status: 503 }
      );
    }

    const raw = await request.json();
    const parsed = parseBody(sendMailSchema, raw);
    if (!parsed.success) return parsed.response;

    const { senderAddress, recipientAddress, recipientTitle, recipientLastName, letterContent, contactLogId, repName } = parsed.data;

    const letterHtml = formatLetterHtml({
      senderAddress: senderAddress as MailingAddress,
      recipientAddress: recipientAddress as MailingAddress,
      recipientTitle: recipientTitle || "Representative",
      recipientLastName: recipientLastName || repName.split(" ").pop() || "",
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      body: letterContent,
    });

    // Lob Letters API (REST)
    const res = await fetch("https://api.lob.com/v1/letters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${lobKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        description: `Letter to ${repName} via CheckMyRep`,
        to: {
          name: recipientAddress.name,
          address_line1: recipientAddress.address_line1,
          address_line2: recipientAddress.address_line2 || undefined,
          address_city: recipientAddress.address_city,
          address_state: recipientAddress.address_state,
          address_zip: recipientAddress.address_zip,
        },
        from: {
          name: senderAddress.name,
          address_line1: senderAddress.address_line1,
          address_line2: senderAddress.address_line2 || undefined,
          address_city: senderAddress.address_city,
          address_state: senderAddress.address_state,
          address_zip: senderAddress.address_zip,
        },
        file: letterHtml,
        color: false,
        metadata: {
          contactLogId: contactLogId || "",
          source: "checkmyrep",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || `Lob send failed: ${res.status}` },
        { status: res.status }
      );
    }

    const letter = await res.json();

    return NextResponse.json({
      letterId: letter.id,
      expectedDeliveryDate: letter.expected_delivery_date,
      trackingUrl: letter.url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
