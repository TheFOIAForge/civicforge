import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentIntentId = session.payment_intent as string;

    if (!paymentIntentId) {
      return NextResponse.json({ status: "pending", letters: [] });
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const meta = pi.metadata || {};
    const lobCount = parseInt(meta.lob_count || "0", 10);

    if (lobCount === 0) {
      // Lob letters haven't been created yet (webhook still processing)
      return NextResponse.json({ status: "processing", letters: [] });
    }

    const letters = [];
    for (let i = 0; i < lobCount; i++) {
      letters.push({
        repName: meta[`lob_${i}_repName`] || "",
        letterId: meta[`lob_${i}_id`] || null,
        expectedDeliveryDate: meta[`lob_${i}_eta`] || null,
        trackingUrl: meta[`lob_${i}_url`] || null,
        thumbnailUrl: meta[`lob_${i}_thumb`] || null,
        error: meta[`lob_${i}_error`] === "true",
        deliveryStatus: meta[`lob_${i}_delivery`] || null,
        deliveryAt: meta[`lob_${i}_delivery_at`] || null,
        trackingDetail: meta[`lob_${i}_tracking_detail`] || null,
      });
    }

    const allSent = letters.every((l) => l.letterId || l.error);

    return NextResponse.json({
      status: allSent ? "sent" : "processing",
      letters,
      receiptEmail: session.customer_details?.email || null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
