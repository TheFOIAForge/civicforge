import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { mailStatusSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

export async function GET(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  const validated = parseBody(mailStatusSchema, { session_id: sessionId });
  if (!validated.success) return validated.response;

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(validated.data.session_id);
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
