"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import type { Representative, MailingAddress } from "@/data/types";

type Step = "preview" | "addresses" | "pay";

interface MailLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  letterContent: string;
  rep: Representative;
  reps?: Representative[];
  contactLogId: string;
  issue: string;
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function parseStoredAddress(): Partial<MailingAddress> {
  try {
    const stored = localStorage.getItem("checkmyrep_sender_address");
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }

  const raw = localStorage.getItem("checkmyrep_address");
  if (raw) {
    const parts = raw.split(",").map((s) => s.trim());
    if (parts.length >= 3) {
      const stateZip = parts[parts.length - 1].split(/\s+/);
      return {
        address_line1: parts[0],
        address_city: parts[parts.length - 2],
        address_state: stateZip[0] || "",
        address_zip: stateZip[1] || "",
      };
    }
  }
  return {};
}

function getRepOffice(rep: Representative, idx: number) {
  return rep.offices[idx] || rep.offices[0];
}

export default function MailLetterModal({ isOpen, onClose, letterContent, rep, reps, contactLogId, issue }: MailLetterModalProps) {
  const allReps = reps && reps.length > 0 ? reps : [rep];
  const [step, setStep] = useState<Step>("preview");
  // Per-rep office selection: { [repId]: officeIndex }
  const [officePerRep, setOfficePerRep] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    allReps.forEach((r) => { m[r.id] = 0; });
    return m;
  });
  const [senderName, setSenderName] = useState("");
  const [senderLine1, setSenderLine1] = useState("");
  const [senderLine2, setSenderLine2] = useState("");
  const [senderCity, setSenderCity] = useState("");
  const [senderState, setSenderState] = useState("");
  const [senderZip, setSenderZip] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "loading" | "deliverable" | "warning" | "error">("idle");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [payError, setPayError] = useState("");
  const [previewIdx, setPreviewIdx] = useState(0);

  useEffect(() => {
    const saved = parseStoredAddress();
    if (saved.name) setSenderName(saved.name);
    if (saved.address_line1) setSenderLine1(saved.address_line1);
    if (saved.address_line2) setSenderLine2(saved.address_line2 || "");
    if (saved.address_city) setSenderCity(saved.address_city);
    if (saved.address_state) setSenderState(saved.address_state);
    if (saved.address_zip) setSenderZip(saved.address_zip);
  }, []);

  if (!isOpen) return null;

  const senderAddress: MailingAddress = {
    name: senderName,
    address_line1: senderLine1,
    address_line2: senderLine2 || undefined,
    address_city: senderCity,
    address_state: senderState,
    address_zip: senderZip,
  };

  const senderValid = senderName && senderLine1 && senderCity && senderState && senderZip;

  // Current preview rep
  const previewRep = allReps[previewIdx] || allReps[0];
  const previewOffice = getRepOffice(previewRep, officePerRep[previewRep.id] || 0);

  function setRepOffice(repId: string, idx: number) {
    setOfficePerRep((prev) => ({ ...prev, [repId]: idx }));
  }

  async function handleVerify() {
    setVerifyStatus("loading");
    setVerifyMsg("");
    try {
      const res = await fetch("/api/mail/verify-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_line1: senderLine1,
          address_line2: senderLine2,
          address_city: senderCity,
          address_state: senderState,
          address_zip: senderZip,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyStatus("error");
        setVerifyMsg(data.error || "Verification failed");
        return;
      }
      if (data.deliverability === "deliverable") {
        setVerifyStatus("deliverable");
        setVerifyMsg("Address verified");
        if (data.primary_line) setSenderLine1(data.primary_line);
        if (data.city) setSenderCity(data.city);
        if (data.state) setSenderState(data.state);
        if (data.zip_code) setSenderZip(data.zip_code);
      } else if (data.deliverability === "deliverable_missing_unit") {
        setVerifyStatus("warning");
        setVerifyMsg("Deliverable but may be missing apartment/unit number");
      } else {
        setVerifyStatus("error");
        setVerifyMsg(`Address may not be deliverable: ${data.deliverability}`);
      }
    } catch {
      setVerifyStatus("error");
      setVerifyMsg("Could not verify address");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
    >
      <div
        className="w-full max-w-2xl my-8 mx-4"
        style={{ backgroundColor: "#fff" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ backgroundColor: "#C1272D" }}>
          <div>
            <h2 className="font-headline text-2xl text-white normal-case m-0">
              Mail This Letter
            </h2>
            <p className="font-mono text-[10px] text-white/70 mt-1">
              PHYSICAL LETTER VIA USPS — {allReps.length} RECIPIENT{allReps.length !== 1 ? "S" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white text-2xl font-headline cursor-pointer bg-transparent border-none p-2 hover:text-white/70"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
          {(["preview", "addresses", "pay"] as Step[]).map((s, i) => (
            <button
              key={s}
              onClick={() => {
                if (s === "preview" || (s === "addresses" && step !== "preview") || (s === "pay" && step === "pay")) {
                  setStep(s);
                }
              }}
              className="flex-1 py-3 font-mono text-xs font-bold uppercase text-center cursor-pointer border-none"
              style={{
                backgroundColor: step === s ? "#C1272D" : "transparent",
                color: step === s ? "#fff" : "rgba(0,0,0,0.4)",
              }}
            >
              {i + 1}. {s === "preview" ? "Preview" : s === "addresses" ? "Addresses" : "Pay & Mail"}
            </button>
          ))}
        </div>

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="p-5">
            {/* Rep selector tabs (multi-rep) */}
            {allReps.length > 1 && (
              <div className="mb-4">
                <p className="font-mono text-xs font-bold mb-2" style={{ color: "rgba(0,0,0,0.5)" }}>
                  PREVIEW LETTER TO:
                </p>
                <div className="flex flex-wrap gap-2">
                  {allReps.map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => setPreviewIdx(i)}
                      className="px-3 py-2 font-mono text-xs font-bold cursor-pointer border-2 transition-colors"
                      style={{
                        backgroundColor: previewIdx === i ? "#111" : "transparent",
                        color: previewIdx === i ? "#fff" : "#111",
                        borderColor: previewIdx === i ? "#111" : "rgba(0,0,0,0.15)",
                      }}
                    >
                      {r.title} {r.lastName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Envelope mockup */}
            <p className="font-mono text-xs font-bold mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>
              ENVELOPE — {previewRep.title.toUpperCase()} {previewRep.fullName.toUpperCase()}
            </p>
            <div
              className="relative mb-6 overflow-hidden"
              style={{
                backgroundColor: "#f5f0e8",
                border: "2px solid rgba(0,0,0,0.12)",
                padding: "20px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1), inset 0 0 40px rgba(0,0,0,0.03)",
                aspectRatio: "9.5 / 4.125",
              }}
            >
              {/* Stamp area */}
              <div
                className="absolute top-3 right-4 flex items-center justify-center"
                style={{
                  width: "48px",
                  height: "56px",
                  border: "2px dashed rgba(0,0,0,0.2)",
                  backgroundColor: "rgba(255,255,255,0.6)",
                }}
              >
                <div className="text-center">
                  <div className="font-mono text-[8px] font-bold" style={{ color: "rgba(0,0,0,0.3)" }}>USPS</div>
                  <div className="font-mono text-[7px]" style={{ color: "rgba(0,0,0,0.25)" }}>FIRST CLASS</div>
                </div>
              </div>

              {/* Return address */}
              <div style={{ fontSize: "9px", fontFamily: "monospace", color: "rgba(0,0,0,0.5)", lineHeight: "1.4" }}>
                <div style={{ fontWeight: "bold" }}>{senderName || "Your Name"}</div>
                <div>{senderLine1 || "Your Street Address"}</div>
                <div>{senderCity || "City"}, {senderState || "ST"} {senderZip || "ZIP"}</div>
              </div>

              {/* Recipient address */}
              <div
                className="absolute"
                style={{
                  left: "35%",
                  top: "50%",
                  transform: "translateY(-30%)",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  color: "#111",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{previewRep.title} {previewRep.fullName}</div>
                <div>{previewOffice?.street}</div>
                <div>{previewOffice?.city}, {previewOffice?.state} {previewOffice?.zip}</div>
              </div>

              <div className="absolute bottom-3 left-4 right-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />
            </div>

            {/* Letter mockup */}
            <p className="font-mono text-xs font-bold mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>
              LETTER — {previewRep.title.toUpperCase()} {previewRep.lastName.toUpperCase()}
            </p>
            <div
              className="relative overflow-hidden"
              style={{
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
                padding: "32px 36px",
                maxHeight: "360px",
                overflowY: "auto",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01), rgba(0,0,0,0.03))" }} />

              <div style={{ marginBottom: "20px", fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", color: "rgba(0,0,0,0.7)" }}>
                {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </div>

              <div style={{ marginBottom: "20px", fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.4", color: "rgba(0,0,0,0.7)" }}>
                <div>{previewRep.title} {previewRep.fullName}</div>
                <div>{previewOffice?.street}</div>
                <div>{previewOffice?.city}, {previewOffice?.state} {previewOffice?.zip}</div>
              </div>

              <div style={{ marginBottom: "16px", fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", color: "#111" }}>
                Dear {previewRep.title} {previewRep.lastName},
              </div>

              <div className="whitespace-pre-wrap" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", lineHeight: "1.6", color: "#111" }}>
                {letterContent}
              </div>

              <div style={{ marginTop: "24px", fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", color: "#111" }}>
                <div style={{ marginBottom: "28px" }}>Respectfully,</div>
                <div>{senderName || "Your Name"}</div>
              </div>
            </div>

            {/* Info bar */}
            <div className="mt-4 flex items-center gap-3 p-3" style={{ backgroundColor: "rgba(193,39,45,0.06)", border: "1px solid rgba(193,39,45,0.15)" }}>
              <div className="shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C1272D" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="font-mono text-xs font-bold" style={{ color: "#C1272D" }}>
                  {allReps.length > 1
                    ? `${allReps.length} IDENTICAL LETTERS — RE: ${issue.toUpperCase()}`
                    : `RE: ${issue.toUpperCase()} — USPS FIRST CLASS`}
                </p>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: "rgba(0,0,0,0.5)" }}>
                  {allReps.length > 1
                    ? "Same letter sent to each recipient at their office address. Arrives in 3-5 business days."
                    : "Printed on quality paper, folded, sealed in envelope, and mailed. Arrives in 3-5 business days."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep("addresses")}
              className="w-full mt-4 py-4 font-headline text-lg uppercase cursor-pointer border-none"
              style={{ backgroundColor: "#C1272D", color: "#fff" }}
            >
              Continue — Enter Addresses
            </button>
          </div>
        )}

        {/* Step: Addresses */}
        {step === "addresses" && (
          <div className="p-5">
            {/* Recipient addresses — one per rep */}
            <div className="mb-6">
              <p className="font-mono text-xs font-bold mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>
                SENDING TO — {allReps.length} RECIPIENT{allReps.length !== 1 ? "S" : ""}
              </p>

              <div className="space-y-3">
                {allReps.map((r) => {
                  const oIdx = officePerRep[r.id] || 0;
                  const o = getRepOffice(r, oIdx);
                  return (
                    <div key={r.id} className="p-3 border-2" style={{ borderColor: "rgba(0,0,0,0.1)", backgroundColor: "rgba(0,0,0,0.02)" }}>
                      <p className="font-mono text-xs font-bold mb-1" style={{ color: "#111" }}>
                        {r.title} {r.fullName}
                      </p>

                      {/* Office selector */}
                      {r.offices.length > 1 && (
                        <div className="flex gap-1 mb-2">
                          {r.offices.map((office, i) => (
                            <button
                              key={i}
                              onClick={() => setRepOffice(r.id, i)}
                              className="px-2 py-1 font-mono text-[10px] font-bold cursor-pointer border"
                              style={{
                                backgroundColor: oIdx === i ? "#111" : "transparent",
                                color: oIdx === i ? "#fff" : "rgba(0,0,0,0.5)",
                                borderColor: oIdx === i ? "#111" : "rgba(0,0,0,0.12)",
                              }}
                            >
                              {office.label}
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="font-body text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
                        {o?.street}
                      </p>
                      <p className="font-body text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
                        {o?.city}, {o?.state} {o?.zip}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sender address */}
            <div className="mb-4">
              <p className="font-mono text-xs font-bold mb-2" style={{ color: "rgba(0,0,0,0.5)" }}>
                YOUR RETURN ADDRESS
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your full name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2.5 font-mono text-sm border-2"
                  style={{ borderColor: "rgba(0,0,0,0.12)", backgroundColor: "rgba(0,0,0,0.02)" }}
                />
                <input
                  type="text"
                  placeholder="Street address"
                  value={senderLine1}
                  onChange={(e) => setSenderLine1(e.target.value)}
                  className="w-full px-3 py-2.5 font-mono text-sm border-2"
                  style={{ borderColor: "rgba(0,0,0,0.12)", backgroundColor: "rgba(0,0,0,0.02)" }}
                />
                <input
                  type="text"
                  placeholder="Apt / Suite (optional)"
                  value={senderLine2}
                  onChange={(e) => setSenderLine2(e.target.value)}
                  className="w-full px-3 py-2.5 font-mono text-sm border-2"
                  style={{ borderColor: "rgba(0,0,0,0.12)", backgroundColor: "rgba(0,0,0,0.02)" }}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={senderCity}
                    onChange={(e) => setSenderCity(e.target.value)}
                    className="w-full px-3 py-2.5 font-mono text-sm border-2"
                    style={{ borderColor: "rgba(0,0,0,0.12)", backgroundColor: "rgba(0,0,0,0.02)" }}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={senderState}
                    onChange={(e) => setSenderState(e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full px-3 py-2.5 font-mono text-sm border-2 uppercase"
                    style={{ borderColor: "rgba(0,0,0,0.12)", backgroundColor: "rgba(0,0,0,0.02)" }}
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={senderZip}
                    onChange={(e) => setSenderZip(e.target.value)}
                    maxLength={10}
                    className="w-full px-3 py-2.5 font-mono text-sm border-2"
                    style={{ borderColor: "rgba(0,0,0,0.12)", backgroundColor: "rgba(0,0,0,0.02)" }}
                  />
                </div>
              </div>

              {senderValid && (
                <button
                  onClick={handleVerify}
                  disabled={verifyStatus === "loading"}
                  className="mt-3 px-4 py-2 font-mono text-xs font-bold cursor-pointer border-2"
                  style={{
                    borderColor: verifyStatus === "deliverable" ? "#16a34a" : "rgba(0,0,0,0.15)",
                    backgroundColor: verifyStatus === "deliverable" ? "rgba(22,163,74,0.1)" : "transparent",
                    color: verifyStatus === "deliverable" ? "#16a34a" : "#111",
                  }}
                >
                  {verifyStatus === "loading" ? "VERIFYING..." : verifyStatus === "deliverable" ? "✓ VERIFIED" : "VERIFY ADDRESS"}
                </button>
              )}

              {verifyMsg && (
                <p
                  className="mt-2 font-mono text-xs font-bold"
                  style={{
                    color: verifyStatus === "deliverable" ? "#16a34a" : verifyStatus === "warning" ? "#ca8a04" : "#C1272D",
                  }}
                >
                  {verifyStatus === "deliverable" ? "✓" : verifyStatus === "warning" ? "⚠" : "✕"} {verifyMsg}
                </p>
              )}
            </div>

            <button
              onClick={() => setStep("pay")}
              disabled={!senderValid}
              className="w-full mt-2 py-4 font-headline text-lg uppercase cursor-pointer border-none"
              style={{
                backgroundColor: senderValid ? "#C1272D" : "rgba(0,0,0,0.1)",
                color: senderValid ? "#fff" : "rgba(0,0,0,0.3)",
              }}
            >
              Continue — Review & Pay
            </button>
          </div>
        )}

        {/* Step: Pay */}
        {step === "pay" && (
          <PayStep
            allReps={allReps}
            officePerRep={officePerRep}
            senderAddress={senderAddress}
            letterContent={letterContent}
            contactLogId={contactLogId}
            issue={issue}
            senderName={senderName}
            payError={payError}
            setPayError={setPayError}
          />
        )}
      </div>
    </div>
  );
}

/* ── Pay Step ── */
function PayStep({
  allReps,
  officePerRep,
  senderAddress,
  letterContent,
  contactLogId,
  issue,
  senderName,
  payError,
  setPayError,
}: {
  allReps: Representative[];
  officePerRep: Record<string, number>;
  senderAddress: MailingAddress;
  letterContent: string;
  contactLogId: string;
  issue: string;
  senderName: string;
  payError: string;
  setPayError: (s: string) => void;
}) {
  useEffect(() => {
    try {
      localStorage.setItem("checkmyrep_sender_address", JSON.stringify(senderAddress));
    } catch { /* ignore */ }
    try {
      sessionStorage.setItem("checkmyrep_pending_mail", JSON.stringify({
        contactLogId,
        repIds: allReps.map((r) => r.id),
        repNames: allReps.map((r) => r.fullName),
        issue,
      }));
    } catch { /* ignore */ }
  }, [senderAddress, contactLogId, allReps, issue]);

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/mail/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactLogId,
        recipients: allReps.map((r) => {
          const o = getRepOffice(r, officePerRep[r.id] || 0);
          return {
            repName: r.fullName,
            repOfficeAddress: {
              name: `${r.title} ${r.fullName}`,
              address_line1: o?.street || "",
              address_city: o?.city || "",
              address_state: o?.state || "",
              address_zip: o?.zip || "",
            },
          };
        }),
        senderAddress,
        letterContent,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPayError(data.error || "Failed to create checkout session");
      throw new Error(data.error);
    }
    return data.clientSecret;
  }, [contactLogId, allReps, officePerRep, senderAddress, letterContent, setPayError]);

  const totalCost = (allReps.length * 1.5).toFixed(2);

  return (
    <div className="p-5">
      <p className="font-mono text-xs font-bold mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>
        {allReps.length > 1 ? `${allReps.length} LETTERS TO SEND` : "LETTER PREVIEW"}
      </p>

      {/* All recipients with their addresses */}
      <div className="mb-4 space-y-1">
        {allReps.map((r) => {
          const o = getRepOffice(r, officePerRep[r.id] || 0);
          return (
            <div
              key={r.id}
              className="flex items-center justify-between p-2"
              style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", fontSize: "11px", fontFamily: "monospace" }}
            >
              <span style={{ fontWeight: "bold", color: "#111" }}>{r.title} {r.fullName}</span>
              <span style={{ color: "rgba(0,0,0,0.4)" }}>{o?.city}, {o?.state}</span>
            </div>
          );
        })}
      </div>

      {/* Mini envelope for first rep */}
      <div
        className="relative mb-4 overflow-hidden"
        style={{
          backgroundColor: "#f5f0e8",
          border: "1px solid rgba(0,0,0,0.1)",
          padding: "12px 16px",
          fontSize: "9px",
          fontFamily: "monospace",
        }}
      >
        <div className="flex justify-between">
          <div style={{ color: "rgba(0,0,0,0.5)", lineHeight: "1.4" }}>
            <div style={{ fontWeight: "bold" }}>{senderName || "Your Name"}</div>
            <div>{senderAddress.address_line1}</div>
            <div>{senderAddress.address_city}, {senderAddress.address_state} {senderAddress.address_zip}</div>
          </div>
          <div style={{ color: "#111", lineHeight: "1.4", textAlign: "right" }}>
            {(() => {
              const firstRep = allReps[0];
              const o = getRepOffice(firstRep, officePerRep[firstRep.id] || 0);
              return (
                <>
                  <div style={{ fontWeight: "bold" }}>{firstRep.title} {firstRep.fullName}</div>
                  <div>{o?.street}</div>
                  <div>{o?.city}, {o?.state} {o?.zip}</div>
                </>
              );
            })()}
          </div>
        </div>
        {allReps.length > 1 && (
          <div className="mt-2 pt-2" style={{ borderTop: "1px dashed rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.4)", fontSize: "8px" }}>
            + {allReps.length - 1} more identical letter{allReps.length - 1 > 1 ? "s" : ""} to other recipients
          </div>
        )}
      </div>

      {/* Compact letter body */}
      <div
        className="mb-4 overflow-hidden"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          padding: "16px 20px",
          maxHeight: "200px",
          overflowY: "auto",
        }}
      >
        <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", color: "rgba(0,0,0,0.7)", marginBottom: "8px" }}>
          Dear {allReps[0].title} {allReps[0].lastName},
        </div>
        <div className="whitespace-pre-wrap" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", lineHeight: "1.5", color: "#111" }}>
          {letterContent.length > 500 ? letterContent.slice(0, 500) + "..." : letterContent}
        </div>
        <div style={{ marginTop: "12px", fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", color: "#111" }}>
          Respectfully,<br />{senderName || "Your Name"}
        </div>
      </div>

      {/* Cost info */}
      <div className="mb-4 p-3 flex items-center justify-between" style={{ backgroundColor: "rgba(193,39,45,0.06)", border: "1px solid rgba(193,39,45,0.15)" }}>
        <div>
          <p className="font-mono text-xs font-bold" style={{ color: "#C1272D" }}>
            {allReps.length > 1
              ? `${allReps.length} LETTERS × $1.50 = $${totalCost}`
              : "USPS FIRST CLASS — $1.50"}
          </p>
          <p className="font-mono text-[10px]" style={{ color: "rgba(0,0,0,0.5)" }}>Includes printing, envelope, and postage</p>
        </div>
        <p className="font-mono text-[10px]" style={{ color: "rgba(0,0,0,0.4)" }}>3-5 business days</p>
      </div>

      {payError && (
        <div className="mb-4 p-3" style={{ backgroundColor: "rgba(193,39,45,0.1)", border: "2px solid #C1272D" }}>
          <p className="font-mono text-xs font-bold" style={{ color: "#C1272D" }}>
            {payError}
          </p>
        </div>
      )}

      {stripePromise ? (
        <div className="rounded overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      ) : (
        <div className="p-4 text-center" style={{ backgroundColor: "rgba(193,39,45,0.05)" }}>
          <p className="font-mono text-xs font-bold" style={{ color: "#C1272D" }}>
            Payment service not configured
          </p>
          <p className="font-mono text-[10px] mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set
          </p>
        </div>
      )}

      <p className="mt-3 text-center font-mono text-[10px]" style={{ color: "rgba(0,0,0,0.4)" }}>
        Secure payment via Stripe. Your card details never touch our servers.
      </p>
    </div>
  );
}
