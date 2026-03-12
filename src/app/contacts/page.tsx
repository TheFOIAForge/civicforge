"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ContactLogEntry, ContactDeliveryStatus, EmailServiceConfig } from "@/data/types";

const STATUS_OPTIONS = [
  { value: "sent", label: "Sent", color: "bg-red-light text-red" },
  { value: "awaiting_response", label: "Awaiting Response", color: "bg-yellow-light text-yellow" },
  { value: "response_received", label: "Response Received", color: "bg-green text-white" },
  { value: "follow_up_needed", label: "Follow-up Needed", color: "bg-status-red-light text-status-red" },
];

const DELIVERY_STATUS_OPTIONS: { value: ContactDeliveryStatus; label: string; color: string }[] = [
  { value: "drafted", label: "DRAFTED", color: "bg-gray-mid text-white" },
  { value: "emailed", label: "EMAILED", color: "bg-green text-white" },
  { value: "called", label: "CALLED", color: "bg-dem text-white" },
  { value: "mailed", label: "MAILED", color: "bg-red text-white" },
];

function statusBadge(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-gray-mid text-white";
}

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

function deliveryBadgeColor(status?: ContactDeliveryStatus) {
  return DELIVERY_STATUS_OPTIONS.find((d) => d.value === status)?.color || "bg-gray-mid text-white";
}

function deliveryLabel(status?: ContactDeliveryStatus) {
  return DELIVERY_STATUS_OPTIONS.find((d) => d.value === status)?.label || "DRAFTED";
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

const methodEmoji: Record<string, string> = {
  letter: "\u{2709}\u{FE0F}",
  call: "\u{1F4DE}",
  social: "\u{1F4F1}",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactLogEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ id: string; ok: boolean; message: string } | null>(null);
  const [hasEmailConfig, setHasEmailConfig] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("civicforge_contacts");
    if (stored) {
      setContacts(JSON.parse(stored));
    }
    setHasEmailConfig(!!localStorage.getItem("civicforge_email_config"));
  }, []);

  function save(updated: ContactLogEntry[]) {
    setContacts(updated);
    localStorage.setItem("civicforge_contacts", JSON.stringify(updated));
  }

  function handleDelete(id: string) {
    save(contacts.filter((c) => c.id !== id));
  }

  function handleUpdate(id: string) {
    save(
      contacts.map((c) =>
        c.id === id ? { ...c, notes: editNotes, status: editStatus as ContactLogEntry["status"] } : c
      )
    );
    setEditingId(null);
  }

  function startEdit(entry: ContactLogEntry) {
    setEditingId(entry.id);
    setEditNotes(entry.notes);
    setEditStatus(entry.status);
  }

  function markDeliveryStatus(id: string, deliveryStatus: ContactDeliveryStatus) {
    const now = new Date().toISOString();
    save(
      contacts.map((c) => {
        if (c.id !== id) return c;
        const updates: Partial<ContactLogEntry> = { deliveryStatus };
        if (deliveryStatus === "emailed") updates.emailedAt = now;
        if (deliveryStatus === "called") updates.calledAt = now;
        if (deliveryStatus === "mailed") updates.mailedAt = now;
        return { ...c, ...updates };
      })
    );
  }

  function handleEmailViaMailto(entry: ContactLogEntry) {
    const subject = `Re: ${entry.issue}`;
    const body = entry.content || "";
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_self");
    // Mark as emailed
    markDeliveryStatus(entry.id, "emailed");
  }

  async function handleEmailViaService(entry: ContactLogEntry) {
    const configStr = localStorage.getItem("civicforge_email_config");
    if (!configStr || !entry.content) return;
    const config: EmailServiceConfig = JSON.parse(configStr);
    setSendingId(entry.id);
    setSendResult(null);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "", // User needs to specify — opens prompt
          subject: `Re: ${entry.issue}`,
          body: entry.content,
          provider: config.provider,
          apiKey: config.apiKey,
          from: config.senderEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        markDeliveryStatus(entry.id, "emailed");
        setSendResult({ id: entry.id, ok: true, message: "Email sent successfully." });
      } else {
        setSendResult({ id: entry.id, ok: false, message: data.error || "Failed to send." });
      }
    } catch (err) {
      setSendResult({ id: entry.id, ok: false, message: err instanceof Error ? err.message : "Network error." });
    } finally {
      setSendingId(null);
    }
  }

  const followUpCount = contacts.filter(
    (c) => c.status === "awaiting_response" && daysSince(c.date) >= 14
  ).length;

  const emailedCount = contacts.filter((c) => c.deliveryStatus === "emailed").length;

  function handlePrintEntry(entry: ContactLogEntry) {
    // Create a clean printable version of a single contact entry
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Letter to ${entry.repName}</title>
<style>
  body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.6; max-width: 700px; margin: 40px auto; color: #000; }
  h1 { font-family: Arial Black, sans-serif; font-size: 16pt; text-transform: uppercase; margin-bottom: 4pt; }
  .meta { font-family: Courier New, monospace; font-size: 9pt; color: #666; margin-bottom: 4pt; }
  .divider { border-top: 2pt solid #000; margin: 12pt 0 18pt; }
  .content { white-space: pre-wrap; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>${entry.method === "letter" ? "Letter" : entry.method === "call" ? "Call Script" : "Social Posts"} to ${entry.repName}</h1>
<p class="meta">Issue: ${entry.issue} &mdash; ${entry.date}</p>
<div class="divider"></div>
<div class="content">${(entry.content || entry.notes || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
</body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-print-content>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="font-headline text-5xl md:text-6xl mb-2">Contact Log</h1>
          <p className="font-mono text-sm text-gray-mid font-bold">
            TRACK YOUR LETTERS, CALLS, AND POSTS — AUTOMATICALLY LOGGED FROM THE DRAFTER
          </p>
        </div>
        {contacts.length > 0 && (
          <div className="flex gap-2 shrink-0" data-print-hide>
            <button
              onClick={() => {
                const headers = ["Date", "Representative", "Method", "Issue", "Status", "Delivery", "Notes"];
                const csvRows = [headers.join(",")];
                for (const c of contacts) {
                  const row = [c.date, c.repName, c.method, c.issue, c.status, c.deliveryStatus || "drafted", c.notes].map(
                    (field) => `"${String(field ?? "").replace(/"/g, '""')}"`
                  );
                  csvRows.push(row.join(","));
                }
                const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "civicforge-contacts.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-5 py-3 font-mono text-sm font-bold uppercase border-3 border-border bg-surface hover:bg-hover transition-colors cursor-pointer tracking-wider"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-3 font-mono text-sm font-bold uppercase border-3 border-border bg-surface hover:bg-hover transition-colors cursor-pointer tracking-wider"
            >
              Print All
            </button>
          </div>
        )}
      </div>

      {/* Stats bar */}
      {contacts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="border-2 border-border bg-surface p-4 text-center">
            <div className="font-headline text-3xl">{contacts.length}</div>
            <div className="font-mono text-xs text-gray-mid font-bold">Total Contacts</div>
          </div>
          <div className="border-2 border-border bg-surface p-4 text-center">
            <div className="font-headline text-3xl">
              {contacts.filter((c) => c.method === "letter").length}
            </div>
            <div className="font-mono text-xs text-gray-mid font-bold">Letters</div>
          </div>
          <div className="border-2 border-border bg-surface p-4 text-center">
            <div className="font-headline text-3xl">
              {contacts.filter((c) => c.method === "call").length}
            </div>
            <div className="font-mono text-xs text-gray-mid font-bold">Calls</div>
          </div>
          <div className="border-2 border-border bg-surface p-4 text-center">
            <div className="font-headline text-3xl text-green">{emailedCount}</div>
            <div className="font-mono text-xs text-gray-mid font-bold">Emailed</div>
          </div>
          <div className={`border-2 p-4 text-center ${followUpCount > 0 ? "border-status-red bg-status-red-light" : "border-border bg-surface"}`}>
            <div className={`font-headline text-3xl ${followUpCount > 0 ? "text-status-red" : ""}`}>
              {followUpCount}
            </div>
            <div className="font-mono text-xs text-gray-mid font-bold">Need Follow-up</div>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="border-3 border-border p-16 text-center bg-surface">
          <span className="text-5xl block mb-4">{"\u{1F4CB}"}</span>
          <h2 className="font-headline text-3xl mb-3">No contacts yet</h2>
          <p className="font-body text-lg text-gray-mid mb-6">
            When you use the AI drafting tool, your contacts are automatically logged here.
          </p>
          <Link
            href="/draft"
            className="inline-block px-8 py-4 bg-red text-white font-headline uppercase text-base no-underline hover:bg-red-dark transition-colors border-3 border-red hover:border-red-dark"
          >
            Draft Your First Letter
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts
            .slice()
            .reverse()
            .map((entry) => {
              const days = daysSince(entry.date);
              const needsFollowUp = days >= 14 && entry.status === "awaiting_response";
              const isEditing = editingId === entry.id;
              const isSending = sendingId === entry.id;

              return (
                <div
                  key={entry.id}
                  data-print-entry
                  className={`border-2 border-border p-5 bg-surface ${
                    needsFollowUp ? "border-l-6 border-l-status-red" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-2xl">{methodEmoji[entry.method] || "\u{1F4E8}"}</span>
                      <span className={`px-3 py-1 font-mono text-xs font-bold ${statusBadge(entry.status)}`}>
                        {statusLabel(entry.status)}
                      </span>
                      {/* Delivery Status Badge */}
                      <span className={`px-3 py-1 font-mono text-xs font-bold ${deliveryBadgeColor(entry.deliveryStatus)}`}>
                        {deliveryLabel(entry.deliveryStatus)}
                      </span>
                      <span className="font-mono text-sm text-gray-mid font-bold uppercase">
                        {entry.method}
                      </span>
                      <span className="font-mono text-sm text-gray-mid">
                        {entry.date}
                      </span>
                      {needsFollowUp && (
                        <span className="px-3 py-1 font-mono text-xs bg-status-red text-white font-bold motion-safe:animate-pulse">
                          {"\u{26A0}\u{FE0F}"} FOLLOW UP — {days} DAYS
                        </span>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex gap-2 flex-wrap">
                        {/* Email This Letter button */}
                        {entry.content && (
                          <button
                            onClick={() => handleEmailViaMailto(entry)}
                            className="px-4 py-2 font-mono text-sm border-2 border-red text-red cursor-pointer hover:bg-red hover:text-white transition-colors font-bold"
                          >
                            &#9993; Email
                          </button>
                        )}
                        {/* Print this entry */}
                        {entry.content && (
                          <button
                            onClick={() => handlePrintEntry(entry)}
                            className="px-4 py-2 font-mono text-sm border-2 border-border text-gray-mid cursor-pointer hover:bg-black hover:text-white hover:border-black transition-colors font-bold"
                          >
                            Print
                          </button>
                        )}
                        {/* Direct send via service */}
                        {entry.content && hasEmailConfig && (
                          <button
                            onClick={() => handleEmailViaService(entry)}
                            disabled={isSending}
                            className={`px-4 py-2 font-mono text-sm border-2 cursor-pointer transition-colors font-bold ${
                              isSending
                                ? "border-gray-mid text-gray-mid"
                                : "border-green text-green hover:bg-green hover:text-white"
                            }`}
                          >
                            {isSending ? "Sending..." : "Send Direct"}
                          </button>
                        )}
                        {/* Mark delivery status buttons */}
                        <select
                          value={entry.deliveryStatus || "drafted"}
                          onChange={(e) => markDeliveryStatus(entry.id, e.target.value as ContactDeliveryStatus)}
                          className="px-3 py-2 border-2 border-border font-mono text-xs bg-surface cursor-pointer font-bold"
                        >
                          {DELIVERY_STATUS_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => startEdit(entry)}
                          className="px-4 py-2 font-mono text-sm border-2 border-border cursor-pointer hover:bg-hover transition-colors font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="px-4 py-2 font-mono text-sm border-2 border-border cursor-pointer hover:bg-status-red hover:text-white hover:border-status-red transition-colors font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <h3 className="font-headline text-xl normal-case">{entry.repName}</h3>
                    <p className="font-mono text-sm text-gray-mid font-bold">Issue: {entry.issue}</p>
                    {entry.emailedAt && (
                      <p className="font-mono text-xs text-green mt-1">
                        Emailed: {new Date(entry.emailedAt).toLocaleDateString()}
                      </p>
                    )}
                    {entry.calledAt && (
                      <p className="font-mono text-xs text-dem mt-1">
                        Called: {new Date(entry.calledAt).toLocaleDateString()}
                      </p>
                    )}
                    {entry.mailedAt && (
                      <p className="font-mono text-xs text-red mt-1">
                        Mailed: {new Date(entry.mailedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Send result message */}
                  {sendResult && sendResult.id === entry.id && (
                    <div className={`mt-3 p-3 font-mono text-sm font-bold border-2 ${
                      sendResult.ok
                        ? "border-green bg-green-light text-green"
                        : "border-status-red bg-status-red-light text-status-red"
                    }`}>
                      {sendResult.ok ? "\u2705" : "\u274C"} {sendResult.message}
                    </div>
                  )}

                  {isEditing ? (
                    <div className="mt-4 space-y-3 p-4 bg-cream border-2 border-border-light">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 border-2 border-border font-mono text-sm bg-surface"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border-2 border-border font-body text-base resize-none bg-surface"
                        placeholder="Notes..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(entry.id)}
                          className="px-5 py-2 bg-green text-white font-mono text-sm cursor-pointer hover:bg-black transition-colors font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-5 py-2 font-mono text-sm border-2 border-border cursor-pointer hover:bg-hover transition-colors font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    entry.notes && (
                      <p className="mt-3 font-body text-base text-gray-mid">{entry.notes}</p>
                    )
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
