import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createHmac } from "crypto";

// ── Lob webhook signature verification ──
// Lob signs webhooks with HMAC-SHA256. If LOB_WEBHOOK_SECRET is set, we verify.
function verifyLobSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  // Timing-safe comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// Lob webhook event types we care about
type LobEventType =
  | "letter.created"
  | "letter.rendered_pdf"
  | "letter.rendered_thumbnails"
  | "letter.deleted"
  | "letter.mailed"
  | "letter.in_transit"
  | "letter.in_local_area"
  | "letter.re-routed"
  | "letter.returned_to_sender";

interface LobWebhookEvent {
  id: string;
  event_type: { id: LobEventType };
  body: {
    id: string;
    description?: string;
    expected_delivery_date?: string;
    tracking_events?: Array<{
      type: string;
      name: string;
      time: string;
      location?: string;
    }>;
    metadata?: Record<string, string>;
    thumbnails?: Array<{ large: string }>;
    url?: string;
  };
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);

  // Read raw body for signature verification
  const rawBody = await request.text();

  // Verify Lob webhook signature if secret is configured
  const lobWebhookSecret = process.env.LOB_WEBHOOK_SECRET;
  if (lobWebhookSecret) {
    const signature = request.headers.get("lob-signature");
    if (!verifyLobSignature(rawBody, signature, lobWebhookSecret)) {
      console.error("Lob webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: LobWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event_type?.id;
  const letter = event.body;

  if (!letter?.id || !eventType) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  console.log(`Lob webhook: ${eventType} for letter ${letter.id}`);

  // We only update PaymentIntent metadata for delivery tracking events
  const trackingEvents: LobEventType[] = [
    "letter.mailed",
    "letter.in_transit",
    "letter.in_local_area",
    "letter.re-routed",
    "letter.returned_to_sender",
  ];

  if (!trackingEvents.includes(eventType)) {
    return NextResponse.json({ received: true });
  }

  // Find the PaymentIntent via the Stripe session ID stored in Lob metadata
  const stripeSessionId = letter.metadata?.stripeSessionId;
  if (!stripeSessionId) {
    console.log("No stripeSessionId in Lob letter metadata, skipping");
    return NextResponse.json({ received: true });
  }

  try {
    // Retrieve the checkout session to get the payment intent
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    const paymentIntentId = session.payment_intent as string;
    if (!paymentIntentId) {
      return NextResponse.json({ received: true });
    }

    // Read current metadata
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const meta = pi.metadata || {};
    const lobCount = parseInt(meta.lob_count || "0", 10);

    // Find which index this letter corresponds to
    let letterIdx = -1;
    for (let i = 0; i < lobCount; i++) {
      if (meta[`lob_${i}_id`] === letter.id) {
        letterIdx = i;
        break;
      }
    }

    if (letterIdx === -1) {
      console.log(`Letter ${letter.id} not found in PaymentIntent metadata`);
      return NextResponse.json({ received: true });
    }

    // Map Lob event types to user-friendly statuses
    const statusMap: Record<string, string> = {
      "letter.mailed": "Mailed",
      "letter.in_transit": "In Transit",
      "letter.in_local_area": "Out for Delivery",
      "letter.re-routed": "Re-routed",
      "letter.returned_to_sender": "Returned to Sender",
    };

    const updateMeta: Record<string, string> = {
      [`lob_${letterIdx}_delivery`]: statusMap[eventType] || eventType,
      [`lob_${letterIdx}_delivery_at`]: new Date().toISOString(),
    };

    // Include latest tracking event details
    if (letter.tracking_events && letter.tracking_events.length > 0) {
      const latest = letter.tracking_events[letter.tracking_events.length - 1];
      updateMeta[`lob_${letterIdx}_tracking_detail`] = latest.name || latest.type;
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { ...meta, ...updateMeta },
    });

    console.log(`Updated delivery status for letter ${letter.id}: ${statusMap[eventType]}`);
  } catch (err) {
    console.error("Failed to update delivery status:", err);
  }

  return NextResponse.json({ received: true });
}
