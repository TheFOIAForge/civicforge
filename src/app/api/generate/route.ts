import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/generate
 *
 * Server-side proxy for Anthropic Claude API calls.
 * Keeps user API keys out of browser DevTools / network logs
 * and removes the need for `anthropic-dangerous-direct-browser-access`.
 */

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

export async function POST(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  let body: {
    apiKey?: string;
    system?: string;
    userMessage?: string;
    maxTokens?: number;
    model?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { apiKey, system, userMessage, maxTokens, model } = body;

  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json({ error: "Missing API key" }, { status: 400 });
  }
  if (!userMessage || typeof userMessage !== "string") {
    return NextResponse.json({ error: "Missing user message" }, { status: 400 });
  }

  // Cap max_tokens to prevent abuse
  const safeMaxTokens = Math.min(maxTokens || 1500, 4000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-20250514",
        max_tokens: safeMaxTokens,
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || `Anthropic API error: ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Generate proxy error:", err);
    return NextResponse.json(
      { error: "Failed to reach Anthropic API" },
      { status: 502 }
    );
  }
}
