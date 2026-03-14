import { NextRequest, NextResponse } from "next/server";
import { sendEmailSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });

// API keys are now server-side only — never accepted from the client.
async function sendViaResend(to: string, subject: string, body: string, from: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Email service (Resend) not configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: body,
    }),
  });

  if (res.ok) return { ok: true };

  const data = await res.json().catch(() => ({}));
  return {
    ok: false,
    error: data.message || data.error || `Resend error: ${res.status}`,
  };
}

async function sendViaSendGrid(to: string, subject: string, body: string, from: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return { ok: false, error: "Email service (SendGrid) not configured" };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });

  if (res.ok || res.status === 202) return { ok: true };

  const data = await res.json().catch(() => ({}));
  return {
    ok: false,
    error: data.errors?.[0]?.message || data.message || `SendGrid error: ${res.status}`,
  };
}

export async function POST(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  try {
    const raw = await request.json();
    const parsed = parseBody(sendEmailSchema, raw);
    if (!parsed.success) return parsed.response;

    const { to, subject, body } = parsed.data;
    const from = process.env.EMAIL_FROM || "noreply@checkmyrep.us";

    // Try Resend first, fall back to SendGrid
    const resendKey = process.env.RESEND_API_KEY;
    const sendgridKey = process.env.SENDGRID_API_KEY;

    if (!resendKey && !sendgridKey) {
      return NextResponse.json(
        { error: "Email service not configured. Set RESEND_API_KEY or SENDGRID_API_KEY." },
        { status: 503 }
      );
    }

    const result = resendKey
      ? await sendViaResend(to, subject, body, from)
      : await sendViaSendGrid(to, subject, body, from);

    if (result.ok) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: result.error }, { status: 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
