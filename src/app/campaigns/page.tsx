"use client";

import { useState, useEffect } from "react";
import { issues } from "@/data/issues";
import type { Campaign, Representative } from "@/data/types";

export default function CampaignsPage() {
  const [allReps, setAllReps] = useState<Representative[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [issueSlug, setIssueSlug] = useState("");
  const [letterTemplate, setLetterTemplate] = useState("");
  const [targetRepIds, setTargetRepIds] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setAllReps)
      .catch(() => {});
    const stored = localStorage.getItem("checkmyrep_campaigns");
    if (stored) {
      setCampaigns(JSON.parse(stored));
    }
  }, []);

  function save(updated: Campaign[]) {
    setCampaigns(updated);
    localStorage.setItem("checkmyrep_campaigns", JSON.stringify(updated));
  }

  function handleCreate() {
    if (!title.trim() || !letterTemplate.trim()) return;
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      title: title.trim(),
      issue: issues.find((i) => i.slug === issueSlug)?.name || "General",
      letterTemplate: letterTemplate.trim(),
      targetRepIds,
      createdAt: new Date().toISOString().split("T")[0],
      joinCount: 1,
    };
    save([...campaigns, newCampaign]);
    setCreating(false);
    setTitle("");
    setIssueSlug("");
    setLetterTemplate("");
    setTargetRepIds([]);
  }

  function handleDelete(id: string) {
    save(campaigns.filter((c) => c.id !== id));
  }

  function getCampaignSummary(campaign: Campaign) {
    const targetReps = allReps.filter((r) => campaign.targetRepIds.includes(r.id));
    const lines = [
      `Campaign: ${campaign.title}`,
      `Issue: ${campaign.issue}`,
      `Created: ${campaign.createdAt}`,
      "",
      "Letter Template:",
      campaign.letterTemplate,
    ];
    if (targetReps.length > 0) {
      lines.push("", "Target Representatives:");
      targetReps.forEach((r) => lines.push(`  - ${r.fullName} (${r.party}) — ${r.state}`));
    }
    return lines.join("\n");
  }

  function handleCopyDetails(campaign: Campaign) {
    navigator.clipboard.writeText(getCampaignSummary(campaign));
    setCopied(campaign.id);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleRep(repId: string) {
    setTargetRepIds((prev) =>
      prev.includes(repId) ? prev.filter((id) => id !== repId) : [...prev, repId]
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Campaigns</h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        ORGANIZE YOUR ADVOCACY — CREATE CAMPAIGNS AND SHARE DETAILS WITH OTHERS
      </p>

      <div className="mb-6 p-4 border-2 border-border-light bg-surface">
        <p className="font-mono text-xs text-gray-mid">
          <span className="font-bold">NOTE:</span> Campaigns are saved to your browser only (localStorage). Use &quot;Copy Campaign Details&quot; to share campaign information with others via email or messaging.
        </p>
      </div>

      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="mb-8 px-8 py-4 bg-red text-white font-headline uppercase text-base border-3 border-red cursor-pointer hover:bg-red-dark hover:border-red-dark transition-colors"
        >
          {"\u{1F4E2}"} Create New Campaign
        </button>
      )}

      {/* Create form */}
      {creating && (
        <div className="mb-8 border-3 border-border p-6 bg-surface">
          <h2 className="font-headline text-3xl mb-6">{"\u{1F4E2}"} New Campaign</h2>

          <div className="mb-5">
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">CAMPAIGN TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Protect Medicare Coverage"
              className="w-full px-4 py-3 border-2 border-border bg-cream font-body text-base focus:outline-none focus:border-red"
            />
          </div>

          <div className="mb-5">
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">ISSUE</label>
            <select
              value={issueSlug}
              onChange={(e) => setIssueSlug(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border bg-cream font-mono text-base focus:outline-none focus:border-red"
            >
              <option value="">Select an issue...</option>
              {issues.map((iss) => (
                <option key={iss.id} value={iss.slug}>{iss.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">LETTER TEMPLATE</label>
            <textarea
              value={letterTemplate}
              onChange={(e) => setLetterTemplate(e.target.value)}
              placeholder="Write a template letter. The AI will personalize this for each person who joins the campaign."
              rows={8}
              className="w-full px-4 py-3 border-2 border-border bg-cream font-body text-base focus:outline-none focus:border-red resize-none"
            />
          </div>

          <div className="mb-5">
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">
              TARGET REPRESENTATIVES (OPTIONAL)
            </label>
            <div className="max-h-48 overflow-y-auto border-2 border-border p-3 bg-cream">
              {allReps.map((rep) => (
                <label
                  key={rep.id}
                  className="flex items-center gap-3 py-2 cursor-pointer hover:bg-hover px-2 border-b border-border-light last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={targetRepIds.includes(rep.id)}
                    onChange={() => toggleRep(rep.id)}
                    className="accent-red w-4 h-4"
                  />
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold ${rep.party === "D" ? "bg-dem text-white" : rep.party === "R" ? "bg-rep text-white" : "bg-ind text-white"}`}>
                    {rep.party}
                  </span>
                  <span className="font-mono text-sm">
                    {rep.fullName} — {rep.state}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="px-8 py-3 bg-red text-white font-headline uppercase text-base cursor-pointer hover:bg-red-dark transition-colors border-3 border-red hover:border-red-dark"
            >
              Create Campaign
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-8 py-3 font-headline uppercase text-base border-3 border-border cursor-pointer hover:bg-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 && !creating ? (
        <div className="border-3 border-border p-16 text-center bg-surface">
          <span className="text-5xl block mb-4">{"\u{1F4E3}"}</span>
          <h2 className="font-headline text-3xl mb-3">No campaigns yet</h2>
          <p className="font-body text-lg text-gray-mid">
            Create a campaign to organize your advocacy efforts. Copy campaign details to share with others via email or messaging.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {campaigns.map((campaign) => {
            const targetReps = allReps.filter((r) => campaign.targetRepIds.includes(r.id));
            return (
              <div key={campaign.id} className="border-3 border-border bg-surface">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h2 className="font-headline text-2xl normal-case">{campaign.title}</h2>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="px-3 py-1 font-mono text-xs bg-red text-white font-bold">
                          {campaign.issue}
                        </span>
                        <span className="font-mono text-sm text-gray-mid">
                          Created: {campaign.createdAt}
                        </span>
                        <span className="px-3 py-1 font-mono text-xs bg-cream-dark text-gray-mid font-bold">
                          {campaign.joinCount} {campaign.joinCount === 1 ? "participant" : "participants"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyDetails(campaign)}
                        className="px-5 py-2 bg-black text-white font-mono text-sm cursor-pointer hover:bg-red transition-colors font-bold"
                        title="Copies campaign details as text. Campaigns are stored locally and cannot be shared via URL."
                      >
                        {copied === campaign.id ? "Copied!" : "Copy Campaign Details"}
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="px-5 py-2 font-mono text-sm border-2 border-border cursor-pointer hover:bg-status-red hover:text-white hover:border-status-red transition-colors font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Template preview */}
                  <div className="mt-4 p-4 bg-cream border-2 border-border-light">
                    <p className="font-mono text-xs text-gray-mid font-bold mb-2">LETTER TEMPLATE:</p>
                    <p className="font-body text-base line-clamp-4">{campaign.letterTemplate}</p>
                  </div>

                  {/* Target reps */}
                  {targetReps.length > 0 && (
                    <div className="mt-4">
                      <p className="font-mono text-xs text-gray-mid font-bold mb-2">TARGET REPRESENTATIVES:</p>
                      <div className="flex flex-wrap gap-2">
                        {targetReps.map((rep) => (
                          <span key={rep.id} className="px-3 py-1 border-2 border-border font-mono text-xs font-bold">
                            {rep.fullName} ({rep.party})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
