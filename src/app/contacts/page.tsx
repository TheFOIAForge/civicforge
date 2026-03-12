"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ContactLogEntry } from "@/data/types";

const STATUS_OPTIONS = [
  { value: "sent", label: "Sent", color: "bg-red-light text-red" },
  { value: "awaiting_response", label: "Awaiting Response", color: "bg-yellow-light text-yellow" },
  { value: "response_received", label: "Response Received", color: "bg-green text-white" },
  { value: "follow_up_needed", label: "Follow-up Needed", color: "bg-status-red-light text-status-red" },
];

function statusBadge(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-gray-mid text-white";
}

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
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

  useEffect(() => {
    const stored = localStorage.getItem("civicforge_contacts");
    if (stored) {
      setContacts(JSON.parse(stored));
    }
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

  const followUpCount = contacts.filter(
    (c) => c.status === "awaiting_response" && daysSince(c.date) >= 14
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Contact Log</h1>
      <p className="font-mono text-sm text-gray-mid mb-4 font-bold">
        TRACK YOUR LETTERS, CALLS, AND POSTS — AUTOMATICALLY LOGGED FROM THE DRAFTER
      </p>

      {/* Stats bar */}
      {contacts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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

              return (
                <div
                  key={entry.id}
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
                      <span className="font-mono text-sm text-gray-mid font-bold uppercase">
                        {entry.method}
                      </span>
                      <span className="font-mono text-sm text-gray-mid">
                        {entry.date}
                      </span>
                      {needsFollowUp && (
                        <span className="px-3 py-1 font-mono text-xs bg-status-red text-white font-bold animate-pulse">
                          {"\u{26A0}\u{FE0F}"} FOLLOW UP — {days} DAYS
                        </span>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex gap-2">
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
                  </div>

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
