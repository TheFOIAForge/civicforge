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
    const { contactLogId, repName, repOfficeAddress, senderAddress, letterContent } = body;

    if (!contactLogId || !repName || !repOfficeAddress || !senderAddress || !letterContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Split letter content across metadata keys (500 char limit per value)
    const metadata: Record<string, string> = {
      contactLogId,
      repName,
      repOfficeAddress: JSON.stringify(repOfficeAddress),
      senderAddress: JSON.stringify(senderAddress),
    };

    const CHUNK_SIZE = 500;
    for (let i = 0; i < letterContent.length; i += CHUNK_SIZE) {
      metadata[`letter_${Math.floor(i / CHUNK_SIZE)}`] = letterContent.slice(i, i + CHUNK_SIZE);
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Mail Letter to ${repName}`,
              description: "Physical letter printed and mailed via USPS First Class",
            },
            unit_amount: 150, // $1.50
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${origin}/draft?mail_success={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/draft?mail_cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
