"use client";

import { useState } from "react";

interface ShareActionProps {
  /** What the user just did — shown in the share text */
  action: string;
  /** Optional rep name for context */
  repName?: string;
  /** Optional issue for context */
  issue?: string;
}

export default function ShareAction({ action, repName, issue }: ShareActionProps) {
  const [copied, setCopied] = useState(false);

  const shareText = [
    `I just ${action}`,
    repName ? `to ${repName}` : "",
    issue ? `about ${issue}` : "",
    "using @CheckMyRep. Your voice matters too.",
    "https://checkmyrep.us",
  ]
    .filter(Boolean)
    .join(" ");

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  }

  return (
    <div className="border-3 border-black bg-black text-white p-5 mt-4">
      <p className="font-headline text-lg mb-3">Share what you did</p>
      <p className="font-body text-sm text-white/70 mb-4">
        Inspire others to take action. Let people know you showed up.
      </p>

      <div className="flex flex-wrap gap-2">
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 font-mono text-xs font-bold no-underline text-white transition-colors"
          style={{ backgroundColor: "#1DA1F2" }}
        >
          SHARE ON X
        </a>
        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 font-mono text-xs font-bold no-underline text-white transition-colors"
          style={{ backgroundColor: "#1877F2" }}
        >
          SHARE ON FACEBOOK
        </a>
        <button
          onClick={copyToClipboard}
          className="px-4 py-2.5 font-mono text-xs font-bold border-2 border-white/30 text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent"
        >
          {copied ? "COPIED!" : "COPY TEXT"}
        </button>
      </div>
    </div>
  );
}
