/**
 * Client-side helper to call Claude via our server proxy.
 * Keeps the user's API key out of browser network logs.
 */

export async function callClaude(opts: {
  apiKey: string;
  system?: string;
  userMessage: string;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: opts.apiKey,
      system: opts.system,
      userMessage: opts.userMessage,
      maxTokens: opts.maxTokens ?? 1500,
      model: opts.model,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "No response generated. Please try again.";
}
