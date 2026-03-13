import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);

  // Get raw body for signature verification
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};

    // Reassemble letter content from chunks
    let letterContent = "";
    for (let i = 0; ; i++) {
      const chunk = meta[`letter_${i}`];
      if (chunk === undefined) break;
      letterContent += chunk;
    }

    if (!letterContent) {
      console.error("No letter content in session metadata", session.id);
      return NextResponse.json({ received: true });
    }

    const senderAddress = JSON.parse(meta.senderAddress || "{}");

    // Build recipients list from metadata (supports multi-rep)
    const recipientCount = parseInt(meta.recipientCount || "0", 10);
    const recipients: Array<{ repName: string; repOfficeAddress: Record<string, string> }> = [];

    if (recipientCount > 0) {
      // New multi-rep format
      for (let i = 0; i < recipientCount; i++) {
        const repName = meta[`rep_${i}_name`] || "";
        const repAddress = JSON.parse(meta[`rep_${i}_address`] || "{}");
        if (repName && repAddress.address_line1) {
          recipients.push({ repName, repOfficeAddress: repAddress });
        }
      }
    } else if (meta.repName && meta.repOfficeAddress) {
      // Legacy single-rep format
      recipients.push({
        repName: meta.repName,
        repOfficeAddress: JSON.parse(meta.repOfficeAddress),
      });
    }

    if (recipients.length === 0) {
      console.error("No recipients found in session metadata", session.id);
      return NextResponse.json({ received: true });
    }

    const lobKey = process.env.LOB_API_KEY;
    if (!lobKey) {
      console.error("LOB_API_KEY not configured");
      return NextResponse.json({ received: true });
    }

    const { formatLetterHtml } = await import("@/lib/letter-template");
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Send a separate letter for each recipient
    for (const recipient of recipients) {
      try {
        const lastName = recipient.repName.split(" ").pop() || "";
        const recipientAddress = recipient.repOfficeAddress;

        const letterHtml = formatLetterHtml({
          senderAddress,
          recipientAddress: recipientAddress as any,
          recipientTitle: "Representative",
          recipientLastName: lastName,
          date,
          body: letterContent,
        });

        const res = await fetch("https://api.lob.com/v1/letters", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${lobKey}:`).toString("base64")}`,
          },
          body: JSON.stringify({
            description: `Letter to ${recipient.repName} via CheckMyRep`,
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
              contactLogId: meta.contactLogId || "",
              stripeSessionId: session.id,
              repName: recipient.repName,
              source: "checkmyrep",
            },
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error(`Lob send failed for ${recipient.repName}:`, err);
        } else {
          const letter = await res.json();
          console.log(`Letter to ${recipient.repName} sent:`, letter.id, "ETA:", letter.expected_delivery_date);
        }
      } catch (err) {
        console.error(`Failed to send letter to ${recipient.repName} via Lob:`, err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
