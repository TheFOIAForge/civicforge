"use client";

import { useState, useCallback } from "react";
import type { Representative } from "@/data/types";

interface ShareToolbarProps {
  repA: Representative;
  repB: Representative;
  tapeRef: React.RefObject<HTMLDivElement | null>;
}

export default function ShareToolbar({ repA, repB, tapeRef }: ShareToolbarProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const showCopied = useCallback((label: string) => {
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Compare ${repA.fullName} vs ${repB.fullName} on CitizenForge`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showCopied("Link");
    } catch { /* fallback */ }
  }, [shareUrl, showCopied]);

  const handleShareImage = useCallback(async () => {
    if (!tapeRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(tapeRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          showCopied("Image");
        } catch {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${repA.lastName}-vs-${repB.lastName}.png`;
          a.click();
          URL.revokeObjectURL(url);
          showCopied("Image Downloaded");
        }
      });
    } catch {
      showCopied("Error");
    }
  }, [tapeRef, repA, repB, showCopied]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleEmbed = useCallback(async () => {
    const embedUrl = `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}embed=true`;
    const code = `<iframe src="${embedUrl}" width="100%" height="900" frameborder="0" title="Compare ${repA.fullName} vs ${repB.fullName}"></iframe>`;
    try {
      await navigator.clipboard.writeText(code);
      showCopied("Embed");
    } catch { /* fallback */ }
  }, [shareUrl, repA, repB, showCopied]);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;

  const buttons: { label: string; icon: string; onClick?: () => void; href?: string }[] = [
    { label: "Copy Link", icon: "🔗", onClick: handleCopyLink },
    { label: "Share Image", icon: "📸", onClick: handleShareImage },
    { label: "Print", icon: "🖨️", onClick: handlePrint },
    { label: "Twitter/X", icon: "𝕏", href: twitterUrl },
    { label: "Facebook", icon: "f", href: facebookUrl },
    { label: "Email", icon: "✉️", href: emailUrl },
    { label: "Embed", icon: "</>", onClick: handleEmbed },
  ];

  return (
    <div className="border-3 border-black bg-black text-white mb-8" data-print-hide>
      <div className="px-5 py-3 flex flex-wrap items-center justify-center gap-2">
        <span className="font-mono text-xs text-white/40 uppercase tracking-wider mr-2 hidden sm:inline">Share:</span>
        {buttons.map(btn => {
          const isActive = copied === btn.label;
          const baseClass = "px-3 py-2 font-mono text-xs font-bold uppercase cursor-pointer transition-colors border-2 flex items-center gap-1.5 no-underline";
          const activeClass = isActive
            ? "border-green-400 bg-green-400/20 text-green-400"
            : "border-white/20 text-white/70 hover:border-white hover:text-white";

          if (btn.href) {
            return (
              <a
                key={btn.label}
                href={btn.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseClass} ${activeClass}`}
              >
                <span aria-hidden="true">{btn.icon}</span>
                <span className="hidden sm:inline">{btn.label}</span>
              </a>
            );
          }

          return (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className={`${baseClass} ${activeClass}`}
            >
              <span aria-hidden="true">{btn.icon}</span>
              <span className="hidden sm:inline">{isActive ? "Copied!" : btn.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
