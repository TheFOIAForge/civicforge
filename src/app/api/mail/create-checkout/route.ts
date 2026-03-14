import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createCheckoutSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });

export async function POST(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey);

    const raw = await request.json();
    const parsed = parseBody(createCheckoutSchema, raw);
    if (!parsed.success) return parsed.response;

    const { contactLogId, senderAddress, senderEmail, letterContent } = parsed.data;

    // Support both single rep (legacy) and multiple reps
    const recipients: Array<{ repName: string; repOfficeAddress: Record<string, string> }> = [];

    if (parsed.data.recipients && Array.isArray(parsed.data.recipients)) {
      for (const r of parsed.data.recipients) {
        if (r.repName && r.repOfficeAddress) {
          recipients.push({ repName: r.repName, repOfficeAddress: r.repOfficeAddress as unknown as Record<string, string> });
        }
      }
    } else if (parsed.data.repName && parsed.data.repOfficeAddress) {
      recipients.push({ repName: parsed.data.repName, repOfficeAddress: parsed.data.repOfficeAddress as unknown as Record<string, string> });
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
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

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
    };

    // Set receipt email if provided
    if (senderEmail) {
      sessionParams.payment_intent_data = {
        receipt_email: senderEmail,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
