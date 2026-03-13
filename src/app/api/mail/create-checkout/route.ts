import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey);

    const body = await request.json();
    const { contactLogId, senderAddress, letterContent } = body;

    // Support both single rep (legacy) and multiple reps
    const recipients: Array<{ repName: string; repOfficeAddress: Record<string, string> }> = [];

    if (body.recipients && Array.isArray(body.recipients)) {
      // New multi-rep format
      for (const r of body.recipients) {
        if (r.repName && r.repOfficeAddress) {
          recipients.push(r);
        }
      }
    } else if (body.repName && body.repOfficeAddress) {
      // Legacy single-rep format
      recipients.push({ repName: body.repName, repOfficeAddress: body.repOfficeAddress });
    }

    if (!contactLogId || recipients.length === 0 || !senderAddress || !letterContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const metadata: Record<string, string> = {
      contactLogId,
      recipientCount: String(recipients.length),
      senderAddress: JSON.stringify(senderAddress),
    };

    // Store each recipient's info
    for (let i = 0; i < recipients.length; i++) {
      metadata[`rep_${i}_name`] = recipients[i].repName;
      metadata[`rep_${i}_address`] = JSON.stringify(recipients[i].repOfficeAddress);
    }

    // Split letter content across metadata keys (500 char limit per value)
    const CHUNK_SIZE = 500;
    for (let i = 0; i < letterContent.length; i += CHUNK_SIZE) {
      metadata[`letter_${Math.floor(i / CHUNK_SIZE)}`] = letterContent.slice(i, i + CHUNK_SIZE);
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const repNames = recipients.map((r) => r.repName);
    const productName = recipients.length === 1
      ? `Mail Letter to ${repNames[0]}`
      : `Mail ${recipients.length} Letters to Congress`;
    const productDesc = recipients.length === 1
      ? "Physical letter printed and mailed via USPS First Class"
      : `Letters to: ${repNames.join(", ")}`;

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: 150, // $1.50 per letter
          },
          quantity: recipients.length,
        },
      ],
      metadata,
      return_url: `${origin}/draft?mail_success={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
