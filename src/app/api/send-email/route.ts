import { NextRequest, NextResponse } from "next/server";

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  provider: "resend" | "sendgrid";
  apiKey: string;
  from: string;
}

async function sendViaResend(req: SendEmailRequest): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      from: req.from,
      to: [req.to],
      subject: req.subject,
      text: req.body,
    }),
  });

  if (res.ok) {
    return { ok: true };
  }

  const data = await res.json().catch(() => ({}));
  return {
    ok: false,
    error: data.message || data.error || `Resend error: ${res.status} ${res.statusText}`,
  };
}

async function sendViaSendGrid(req: SendEmailRequest): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: req.to }] }],
      from: { email: req.from },
      subject: req.subject,
      content: [{ type: "text/plain", value: req.body }],
    }),
  });

  if (res.ok || res.status === 202) {
    return { ok: true };
  }

  const data = await res.json().catch(() => ({}));
  const errMsg =
    data.errors?.[0]?.message || data.message || `SendGrid error: ${res.status} ${res.statusText}`;
  return { ok: false, error: errMsg };
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();

    if (!body.to || !body.subject || !body.body || !body.provider || !body.apiKey || !body.from) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, body, provider, apiKey, from" },
        { status: 400 }
      );
    }

    if (body.provider !== "resend" && body.provider !== "sendgrid") {
      return NextResponse.json(
        { error: "Provider must be 'resend' or 'sendgrid'" },
        { status: 400 }
      );
    }

    const result =
      body.provider === "resend" ? await sendViaResend(body) : await sendViaSendGrid(body);

    if (result.ok) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: result.error }, { status: 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
