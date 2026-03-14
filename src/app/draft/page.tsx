"use client";
import { useState, useEffect, Suspense, useRef, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { issues, getIssueBySlug } from "@/data/issues";
import { buildSystemPrompt } from "@/lib/prompts";
import { callClaude } from "@/lib/claude-client";
import type { Representative } from "@/data/types";
import { useMyReps } from "@/lib/my-reps-context";
import { useAuth } from "@/lib/auth-context";
import { recordAction } from "@/lib/points";
import MailLetterModal from "@/components/MailLetterModal";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Mail,
  Phone,
  PenLine,
  Search,
  Check,
  X,
  Copy,
  Printer,
  ExternalLink,
  Sparkles,
  Send,
  ArrowRight,
  Heart,
  Globe,
  TrendingUp,
  GraduationCap,
  Plane,
  Users,
  Swords,
  Home as HomeIcon,
  Star,
  ChevronDown,
  RotateCcw,
  UserPlus,
} from "lucide-react";

type Mode = "letter" | "call" | "social";

const modeConfig: Record<Mode, { label: string; desc: string; action: string; hint: string; Icon: typeof Mail; civicIcon: string; civicPoster: string }> = {
  letter: { label: "Mail a Letter", desc: "Physical letter via USPS", action: "GENERATE LETTER", hint: "Strongest impact — lands on their desk", Icon: Mail, civicIcon: "/images/civic/icons/mail-animation.mp4", civicPoster: "/images/civic/icons/mail-animation-poster.png" },
  call: { label: "Make a Call", desc: "Talking points for a phone call", action: "GENERATE SCRIPT", hint: "Fastest way to get attention", Icon: Phone, civicIcon: "/images/civic/icons/call-phone.mp4", civicPoster: "/images/civic/icons/call-phone-poster.png" },
  social: { label: "Send an Email", desc: "Email their office directly", action: "GENERATE EMAIL", hint: "Quick and convenient", Icon: PenLine, civicIcon: "/images/civic/icons/email-at.mp4", civicPoster: "/images/civic/icons/email-at-poster.png" },
};

const quickTopics = [
  { label: "Healthcare", slug: "healthcare", Icon: Heart },
  { label: "Climate", slug: "environment", Icon: Globe },
  { label: "Economy", slug: "economy", Icon: TrendingUp },
  { label: "Education", slug: "education", Icon: GraduationCap },
  { label: "Immigration", slug: "immigration", Icon: Plane },
  { label: "Housing", slug: "housing", Icon: HomeIcon },
  { label: "Civil Rights", slug: "civil-rights", Icon: Users },
  { label: "Defense", slug: "defense", Icon: Swords },
];

function partyConfig(party: string) {
  if (party === "D") return { label: "Democrat", bg: "bg-blue", text: "text-blue", light: "bg-blue-light" };
  if (party === "R") return { label: "Republican", bg: "bg-red", text: "text-red", light: "bg-red-light" };
  return { label: "Independent", bg: "bg-purple-600", text: "text-purple-600", light: "bg-purple-50" };
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function DraftInner() {
  const searchParams = useSearchParams();
  const { myReps, hasSavedReps, removeRep, saveRep, isMyRep } = useMyReps();
  const { user, setShowAuthModal, setAuthModalMessage } = useAuth();
  const outputRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [allReps, setAllReps] = useState<Representative[]>([]);
  const [repsLoading, setRepsLoading] = useState(true);
  const [selectedModes, setSelectedModes] = useState<Set<Mode>>(
    new Set([(searchParams.get("mode") as Mode) || "letter"])
  );
  const mode: Mode = selectedModes.has("letter") ? "letter" : selectedModes.has("call") ? "call" : "social";
  const [selectedReps, setSelectedReps] = useState<Representative[]>([]);
  const selectedRep = selectedReps.length > 0 ? selectedReps[0] : null;
  const [selectedIssueSlug, setSelectedIssueSlug] = useState(
    searchParams.get("issue") || ""
  );
  const [concern, setConcern] = useState(searchParams.get("concern") || "");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAllReps, setShowAllReps] = useState(false);
  const [repSearch, setRepSearch] = useState("");
  const [chamberFilter, setChamberFilter] = useState<"All" | "Senate" | "House">("All");
  const [partyFilter, setPartyFilter] = useState<"All" | "D" | "R" | "I">("All");
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [zipResult, setZipResult] = useState<{ state: string | null; districts: string[] } | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [mailSuccess, setMailSuccess] = useState(false);
  const [mailSessionId, setMailSessionId] = useState("");
  const [mailLetters, setMailLetters] = useState<Array<{
    repName: string; letterId: string | null; expectedDeliveryDate: string | null;
    trackingUrl: string | null; thumbnailUrl: string | null; error: boolean;
    deliveryStatus: string | null;
  }>>([]);
  const [mailStatusLoading, setMailStatusLoading] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [lastLogId, setLastLogId] = useState("");

  // Load all reps
  useEffect(() => {
    setRepsLoading(true);
    fetch("/api/members?fields=light")
      .then((r) => r.json())
      .then((data: Representative[]) => {
        setAllReps(data);
        setRepsLoading(false);
        const repParam = searchParams.get("rep");
        if (repParam) {
          const match = data.find((r: Representative) => r.slug === repParam);
          if (match) { setSelectedReps([match]); setStep(3); }
        }
      })
      .catch(() => { setRepsLoading(false); });
  }, [searchParams]);

  // Handle Stripe redirect back
  useEffect(() => {
    const mailSuccessParam = searchParams.get("mail_success");
    if (mailSuccessParam) {
      setMailSuccess(true);
      setMailSessionId(mailSuccessParam);
      try {
        const pending = sessionStorage.getItem("checkmyrep_pending_mail");
        if (pending) {
          const { contactLogId } = JSON.parse(pending);
          const logs = JSON.parse(localStorage.getItem("checkmyrep_contacts") || "[]");
          const idx = logs.findIndex((l: Record<string, string>) => l.id === contactLogId);
          if (idx !== -1) {
            logs[idx].deliveryStatus = "mailed";
            logs[idx].mailedAt = new Date().toISOString();
            logs[idx].stripeSessionId = mailSuccessParam;
            localStorage.setItem("checkmyrep_contacts", JSON.stringify(logs));
          }
          sessionStorage.removeItem("checkmyrep_pending_mail");
        }
      } catch { /* ignore */ }
      window.history.replaceState({}, "", "/draft");
    }
  }, [searchParams]);

  // Poll for mail status
  const pollMailStatus = useCallback(async (sessionId: string) => {
    setMailStatusLoading(true);
    let attempts = 0;
    const maxAttempts = 20;
    const poll = async () => {
      try {
        const res = await fetch(`/api/mail/status?session_id=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.letters && data.letters.length > 0) {
          setMailLetters(data.letters);
          try {
            const logs = JSON.parse(localStorage.getItem("checkmyrep_contacts") || "[]");
            const idx = logs.findIndex((l: Record<string, string>) => l.stripeSessionId === sessionId);
            if (idx !== -1 && data.letters[0]?.letterId) {
              logs[idx].lobLetterId = data.letters.map((l: { letterId: string }) => l.letterId).join(",");
              logs[idx].expectedDeliveryDate = data.letters[0].expectedDeliveryDate || "";
              logs[idx].lobTrackingUrl = data.letters[0].trackingUrl || "";
              localStorage.setItem("checkmyrep_contacts", JSON.stringify(logs));
            }
          } catch { /* ignore */ }
        }
        if (data.status === "sent" || data.status === "error") {
          setMailStatusLoading(false);
          return;
        }
      } catch { /* ignore */ }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 3000);
      } else {
        setMailStatusLoading(false);
      }
    };
    poll();
  }, []);

  useEffect(() => {
    if (mailSessionId) pollMailStatus(mailSessionId);
  }, [mailSessionId, pollMailStatus]);

  useEffect(() => {
    if (selectedRep && step < 3) setStep(3);
  }, [selectedRep, step]);

  const selectedIssue = selectedIssueSlug ? getIssueBySlug(selectedIssueSlug) : undefined;
  const hasFilters = chamberFilter !== "All" || partyFilter !== "All" || stateFilter !== "All" || repSearch.length >= 2;

  // Address / zip search — auto-triggers on zip patterns, debounced for addresses
  const [addressQuery, setAddressQuery] = useState("");
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLookupRef = useRef("");
  const listParentRef = useRef<HTMLDivElement>(null);

  function doAddressLookup(q: string) {
    if (!q || q === lastLookupRef.current) return;
    lastLookupRef.current = q;
    setZipLoading(true);
    setZipResult(null);
    fetch(`/api/zip-district?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.state) {
          setZipResult({ state: data.state, districts: data.districts || [] });
        } else {
          setZipResult({ state: null, districts: [] });
        }
      })
      .catch(() => { setZipResult({ state: null, districts: [] }); })
      .finally(() => setZipLoading(false));
  }

  // Auto-detect zip/address patterns and trigger lookup
  useEffect(() => {
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    const q = addressQuery.trim();

    // 5-digit zip → immediate lookup
    if (/^\d{5}$/.test(q)) {
      lookupTimerRef.current = setTimeout(() => doAddressLookup(q), 300);
      return;
    }
    // Zip+4 → immediate lookup
    if (/^\d{5}[- ]?\d{4}$/.test(q)) {
      lookupTimerRef.current = setTimeout(() => doAddressLookup(q), 300);
      return;
    }
    // Looks like an address (has digits + letters + comma or space, min 10 chars) → debounced
    if (q.length >= 10 && /\d/.test(q) && /[a-zA-Z]/.test(q)) {
      lookupTimerRef.current = setTimeout(() => doAddressLookup(q), 800);
      return;
    }
    // Not a zip/address — clear any previous lookup
    if (zipResult && !q) {
      setZipResult(null);
      lastLookupRef.current = "";
    }
    return () => { if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressQuery]);

  function clearAddressFilter() {
    setAddressQuery("");
    setRepSearch("");
    setZipResult(null);
    lastLookupRef.current = "";
  }

  const dropdownReps = useMemo(() => {
    return allReps.filter((r) => {
      if (chamberFilter !== "All" && r.chamber !== chamberFilter) return false;
      if (partyFilter !== "All" && r.party !== partyFilter) return false;
      if (stateFilter !== "All" && r.stateAbbr !== stateFilter) return false;
      // District-level filtering from address/zip lookup
      if (zipResult?.state) {
        if (r.stateAbbr !== zipResult.state) return false;
        if (r.chamber === "Senate") return true;
        if (zipResult.districts.length > 0 && r.district) {
          return zipResult.districts.includes(r.district);
        }
        return true;
      }
      if (repSearch.length >= 2) {
        const q = repSearch.toLowerCase();
        return r.fullName.toLowerCase().includes(q) || r.state.toLowerCase().includes(q) || r.stateAbbr.toLowerCase() === q;
      }
      return true;
    });
  }, [allReps, chamberFilter, partyFilter, stateFilter, zipResult, repSearch]);

  const rowVirtualizer = useVirtualizer({
    count: dropdownReps.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 56, // ~py-3 + content height
    overscan: 10,
  });

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx(i => {
        const next = Math.min(i + 1, dropdownReps.length - 1);
        rowVirtualizer.scrollToIndex(next, { align: "auto" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx(i => {
        const next = Math.max(i - 1, 0);
        rowVirtualizer.scrollToIndex(next, { align: "auto" });
        return next;
      });
    } else if (e.key === "Enter" && highlightIdx >= 0 && dropdownReps[highlightIdx]) {
      e.preventDefault();
      const rep = dropdownReps[highlightIdx];
      setSelectedReps((prev) => prev.some((r) => r.id === rep.id) ? prev.filter((r) => r.id !== rep.id) : [...prev, rep]);
      setRepSearch("");
      setAddressQuery("");
      setShowAllReps(false);
      setStep(3);
    }
  }

  const activeFilterCount = [chamberFilter !== "All", partyFilter !== "All", stateFilter !== "All"].filter(Boolean).length;

  function getApiKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("checkmyrep_api_key");
  }

  async function handleGenerate() {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("No API key found. Add your Anthropic API key in Settings first.");
      return;
    }
    if (!selectedRep) {
      setError("Pick a representative first.");
      return;
    }
    if (!concern.trim()) {
      setError("Tell us what's on your mind — even a few words work.");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    const systemPrompt = buildSystemPrompt(mode, selectedRep, selectedIssue);

    try {
      const text = await callClaude({
        apiKey,
        system: systemPrompt,
        userMessage: `My concern: ${concern}\n\nMy location: [CITY, STATE] (the user will fill this in)\n\nPlease draft the ${mode === "letter" ? "letter" : mode === "call" ? "call script" : "social media posts"}.`,
      });
      setOutput(text);

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      try {
        const logs = JSON.parse(localStorage.getItem("checkmyrep_contacts") || "[]");
        const logId = Date.now().toString();
        setLastLogId(logId);
        const logEntry: Record<string, unknown> = {
          id: logId,
          repId: selectedRep.id,
          repName: selectedRep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          date: new Date().toISOString().split("T")[0],
          status: "sent",
          notes: concern.slice(0, 100),
          content: text.slice(0, 500),
        };
        if (selectedIssue?.legislation && selectedIssue.legislation.length > 0) {
          logEntry.billNumber = selectedIssue.legislation[0].billNumber;
          logEntry.billId = selectedIssue.legislation[0].id;
        }
        logs.push(logEntry);
        localStorage.setItem("checkmyrep_contacts", JSON.stringify(logs));
      } catch { /* ignore */ }

      if (user) {
        recordAction(user.id, {
          repId: selectedRep.id,
          repName: selectedRep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          content: text,
          concern: concern.slice(0, 500),
        }).catch(() => {});
      } else {
        setShowAccountPrompt(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getMailtoLink() {
    if (!selectedRep || !output) return "";
    const subject = encodeURIComponent(
      `Constituent Message: ${selectedIssue?.name || "Important Issue"}`
    );
    const body = encodeURIComponent(output);
    const email = selectedRep.email || "";
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  function handleOpenContactForm() {
    if (!selectedRep) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    if (selectedRep.contactForm) {
      window.open(selectedRep.contactForm, "_blank");
    } else if (selectedRep.website) {
      window.open(selectedRep.website, "_blank");
    }
  }

  function handleUseOwn() {
    if (selectedReps.length === 0) {
      setError("Pick at least one representative first.");
      return;
    }
    if (!concern.trim()) {
      setError("Write or paste your message above first.");
      return;
    }
    setOutput(concern);
    setError("");
    try {
      const logs = JSON.parse(localStorage.getItem("checkmyrep_contacts") || "[]");
      const logId = Date.now().toString();
      setLastLogId(logId);
      for (const rep of selectedReps) {
        const logEntry: Record<string, unknown> = {
          id: `${logId}-${rep.id}`,
          repId: rep.id,
          repName: rep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          date: new Date().toISOString().split("T")[0],
          status: "sent",
          notes: concern.slice(0, 100),
          content: concern.slice(0, 500),
        };
        if (selectedIssue?.legislation && selectedIssue.legislation.length > 0) {
          logEntry.billNumber = selectedIssue.legislation[0].billNumber;
          logEntry.billId = selectedIssue.legislation[0].id;
        }
        logs.push(logEntry);
      }
      localStorage.setItem("checkmyrep_contacts", JSON.stringify(logs));
    } catch { /* ignore */ }

    if (user) {
      for (const rep of selectedReps) {
        recordAction(user.id, {
          repId: rep.id,
          repName: rep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          content: concern,
          concern: concern.slice(0, 500),
        }).catch(() => {});
      }
    } else {
      setShowAccountPrompt(true);
    }

    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handlePrint() {
    window.print();
  }

  const canGenerate = selectedRep && concern.trim().length > 0;

  return (
    <div className="min-h-screen pb-24 bg-black" data-print-content>
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden">
        <Image
          src="/images/checkmyrep-hero.png"
          alt="CheckMyRep — Write Congress"
          width={1344}
          height={768}
          priority
          className="w-full h-auto object-cover opacity-70"
        />
        {/* Bottom fade into black background */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent" />
        {/* Top subtle fade */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent" />
        {/* Side fades */}
        <div className="absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-black/50 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-black/50 to-transparent" />
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4 relative z-10">
        {/* Mail Success Screen */}
        {mailSuccess ? (
          <div className="space-y-6 pb-24">
            {/* Success header */}
            <Card padding="lg" className="text-center">
              <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green" strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-navy">
                {mailLetters.length > 1 ? `${mailLetters.length} Letters` : "Letter"} on the Way!
              </h2>
              <p className="text-gray-500 mt-2">
                Your {mailLetters.length > 1 ? "letters are" : "letter is"} being printed and will arrive via USPS First Class in 3-5 business days.
              </p>
            </Card>

            {/* Letter tracking cards */}
            {mailStatusLoading && mailLetters.length === 0 && (
              <Card padding="md" className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Processing your {selectedReps.length > 1 ? "letters" : "letter"}...</p>
                </div>
              </Card>
            )}

            {mailLetters.length > 0 && (
              <div className="space-y-3">
                {mailLetters.map((letter, i) => (
                  <Card key={i} padding="md">
                    <div className="flex items-start gap-4">
                      {letter.thumbnailUrl && (
                        <a href={letter.trackingUrl || "#"} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img
                            src={letter.thumbnailUrl}
                            alt={`Letter to ${letter.repName}`}
                            className="w-20 h-auto rounded-lg border border-gray-200 shadow-sm"
                          />
                        </a>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-navy">{letter.repName}</p>
                        {letter.deliveryStatus && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
                            <p className="text-sm text-green font-medium">{letter.deliveryStatus}</p>
                          </div>
                        )}
                        {letter.expectedDeliveryDate && (
                          <p className="text-sm text-gray-500 mt-1">
                            Expected delivery: {new Date(letter.expectedDeliveryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                        {letter.letterId && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">ID: {letter.letterId}</p>
                        )}
                        {letter.trackingUrl && (
                          <a href={letter.trackingUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-teal hover:underline">
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Letter &amp; Track Delivery
                          </a>
                        )}
                        {letter.error && (
                          <p className="text-sm text-red mt-1">Issue sending — we&apos;ll retry automatically.</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!mailStatusLoading && mailLetters.length === 0 && (
              <Card padding="md" className="text-center">
                <Mail className="w-8 h-8 text-navy mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Your letter is being processed. You&apos;ll receive an email confirmation with tracking details shortly.
                </p>
              </Card>
            )}

            {/* Info section */}
            <Card padding="md" className="bg-navy/5 border-navy/10">
              <h3 className="text-sm font-semibold text-navy mb-3">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="text-sm font-medium text-navy">Printing &amp; Processing</p>
                    <p className="text-xs text-gray-500">Your letter is printed on quality paper and sealed in an envelope.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="text-sm font-medium text-navy">USPS First Class Mail</p>
                    <p className="text-xs text-gray-500">Picked up and delivered by USPS. Typical delivery takes 3-5 business days.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="text-sm font-medium text-navy">Delivered to Their Office</p>
                    <p className="text-xs text-gray-500">Your letter arrives at your representative&apos;s office and gets logged by staff.</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => { setMailSuccess(false); setOutput(""); setSelectedReps([]); }}
                variant="primary"
                size="lg"
                icon={<PenLine className="w-4 h-4" />}
                className="w-full"
              >
                Write Another
              </Button>
              <Link href="/profile" className="no-underline">
                <Button variant="outline" size="lg" className="w-full">
                  My Letters
                </Button>
              </Link>
            </div>

            {/* Receipt info */}
            <p className="text-center text-xs text-gray-400">
              A payment receipt was sent by Stripe. Check your email for delivery updates.
            </p>

            {/* Sign up prompt for non-logged-in users */}
            {!user && (
              <Card padding="md" className="border-gold/30 bg-gold-50/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-gold-dark" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy">Track Your Letters</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Create a free account to track delivery status, see your civic history, and earn impact points.
                    </p>
                    <Button
                      onClick={() => {
                        setAuthModalMessage("Create an account to track your mailed letters and civic activity!");
                        setShowAuthModal(true);
                      }}
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      icon={<UserPlus className="w-3.5 h-3.5" />}
                    >
                      Sign Up Free
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : !output ? (
          <div className="space-y-6" data-print-hide>

            {/* Step 1: Pick your rep */}
            <Card padding="none" className="!bg-gradient-to-br !from-gray-950 !via-gray-900 !to-black !border-gray-800 !overflow-hidden relative z-40 mt-8">
              {/* Distressed noise overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />
              <div className="relative px-6 pt-6 pb-2">
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                <h2 className="text-5xl lg:text-6xl tracking-wider text-center relative z-10 w-full" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#ffffff" }}>
                  Who Are You Writing To?
                </h2>
                <p className="text-xl text-white/60 mb-0 mt-1 text-center tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  Select your reps
                </p>
              </div>

              <div className="px-6 pb-6 pt-4">
              {/* Saved reps */}
              {hasSavedReps && (
                <div className="mb-5">
                  <p className="text-sm text-white/40 mb-3 uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Your saved representatives
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {myReps.map((rep) => {
                      const isRepSelected = selectedReps.some((r) => r.id === rep.id);
                      const party = partyConfig(rep.party);
                      const partyColor = rep.party === "R" ? "#dc2626" : rep.party === "D" ? "#2563eb" : "#9333ea";
                      return (
                        <button
                          key={rep.id}
                          onClick={() => {
                            setSelectedReps((prev) => {
                              const exists = prev.some((r) => r.id === rep.id);
                              const next = exists ? prev.filter((r) => r.id !== rep.id) : [...prev, rep];
                              if (next.length > 0) setStep(3);
                              return next;
                            });
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer transition-all border-2
                            ${isRepSelected
                              ? "bg-white/10 backdrop-blur-sm"
                              : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"}`}
                          style={isRepSelected ? { borderColor: partyColor, boxShadow: `0 0 20px ${partyColor}40, inset 0 0 20px ${partyColor}10` } : {}}
                        >
                          {/* Activist checkmark */}
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 transition-all
                            ${isRepSelected ? "border-white" : "border-white/30"}`}
                            style={isRepSelected ? { backgroundColor: partyColor, borderColor: partyColor } : {}}
                          >
                            {isRepSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                          </div>
                          {/* Distressed party badge with portrait */}
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative border-2"
                            style={{ borderColor: partyColor, boxShadow: `0 0 8px ${partyColor}30`, background: `linear-gradient(135deg, ${partyColor}40, ${partyColor}20)` }}
                          >
                            <span className="text-white font-bold text-sm" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>{rep.firstName[0]}{rep.lastName[0]}</span>
                            {rep.photoUrl && (
                              <Image src={rep.photoUrl} alt="" fill sizes="48px" className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            )}
                            {/* Distressed grain overlay on badge */}
                            <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-lg text-white tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{rep.fullName}</span>
                            <span className="block text-sm text-white/50 tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                              {party.label} — {rep.chamber}{rep.stateAbbr ? ` · ${rep.stateAbbr}` : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isRepSelected && (
                              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full mr-1" style={{ color: partyColor, backgroundColor: `${partyColor}20`, border: `1px solid ${partyColor}40` }}>Selected</span>
                            )}
                            <Link
                              href={`/members/${rep.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              title="View profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-white/40 hover:text-white/80" />
                            </Link>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeRep(rep.id); }}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer bg-transparent border-none"
                              title="Remove from saved"
                            >
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            </button>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedReps.length > 1 && (
                    <p className="text-xs font-bold mt-2" style={{ color: "#dc2626" }}>
                      {selectedReps.length} representatives selected
                    </p>
                  )}
                </div>
              )}

              {/* Search for other reps */}
              <div ref={resultsRef}>
                {hasSavedReps && !showAllReps ? (
                  <button
                    onClick={() => setShowAllReps(true)}
                    className="w-full p-4 text-sm font-bold text-center cursor-pointer transition-all
                      border-2 border-dashed border-red-500/40 rounded-xl bg-red-500/5 hover:border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)]"
                    style={{ color: "#dc2626", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: "0.1em" }}
                  >
                    Search All Members of Congress
                  </button>
                ) : (
                  <>
                    {/* Unified search bar — live name filter + address/zip lookup on Enter */}
                    <div className="relative mb-4">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={addressQuery}
                        onChange={(e) => {
                          setAddressQuery(e.target.value);
                          // Live name/state filtering (clears zip result when typing non-address)
                          setRepSearch(e.target.value);
                          if (zipResult) { setZipResult(null); }
                          setHighlightIdx(-1);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search by name, state, address, or zip code..."
                        className="w-full pl-12 pr-36 py-4 bg-white/5 border-2 border-white/15 rounded-xl text-sm text-white
                          placeholder:text-white/30 focus:bg-white/10 focus:border-red-500/50 focus:outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {zipLoading ? (
                          <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> Looking up...
                          </span>
                        ) : zipResult?.state ? (
                          <>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              {zipResult.state}{zipResult.districts.length > 0 ? ` District ${zipResult.districts.join(", ")}` : ""}
                            </span>
                            <button
                              onClick={clearAddressFilter}
                              className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 cursor-pointer bg-transparent border-none transition-colors"
                              aria-label="Clear address filter"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : zipResult && !zipResult.state ? (
                          <>
                            <span className="text-xs font-bold text-red-400">Not found</span>
                            <button
                              onClick={clearAddressFilter}
                              className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 cursor-pointer bg-transparent border-none transition-colors"
                              aria-label="Clear"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : repsLoading ? (
                          <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> Loading...
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> {dropdownReps.length} found
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Filter chips — distressed activist style */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {(["All", "Senate", "House"] as const).map((c) => {
                        const isActive = chamberFilter === c;
                        return (
                          <button
                            key={c}
                            onClick={() => { setChamberFilter(c); setHighlightIdx(-1); }}
                            className={`px-4 py-1.5 text-sm uppercase tracking-wider rounded-lg cursor-pointer transition-all border-2
                              ${isActive
                                ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                : "bg-transparent text-white/70 border-white/20 hover:border-white/50 hover:text-white"}`}
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                          >
                            {c}
                          </button>
                        );
                      })}
                      <div className="w-px h-6 mx-1 bg-white/20" />
                      {(["D", "R", "I"] as const).map((p) => {
                        const isActive = partyFilter === p;
                        const labels = { D: "Dem", R: "GOP", I: "Ind" };
                        const chipColors = {
                          D: { active: "#2563eb", glow: "rgba(37,99,235,0.3)" },
                          R: { active: "#dc2626", glow: "rgba(220,38,38,0.3)" },
                          I: { active: "#9333ea", glow: "rgba(147,51,234,0.3)" },
                        };
                        const cc = chipColors[p];
                        return (
                          <button
                            key={p}
                            onClick={() => { setPartyFilter(partyFilter === p ? "All" : p); setHighlightIdx(-1); }}
                            className="px-4 py-1.5 text-sm uppercase tracking-wider rounded-lg cursor-pointer transition-all border-2"
                            style={{
                              fontFamily: "'Bebas Neue', sans-serif",
                              ...(isActive
                                ? { backgroundColor: cc.active, color: "#fff", borderColor: cc.active, boxShadow: `0 0 15px ${cc.glow}` }
                                : { backgroundColor: "transparent", color: cc.active, borderColor: `${cc.active}50` }),
                            }}
                          >
                            {labels[p]}
                          </button>
                        );
                      })}
                      <div className="w-px h-6 mx-1 bg-white/20" />
                      <select
                        value={stateFilter}
                        onChange={(e) => { setStateFilter(e.target.value); setZipResult(null); setHighlightIdx(-1); }}
                        className="px-4 py-1.5 text-sm uppercase tracking-wider rounded-lg cursor-pointer border-2 transition-all"
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          ...(stateFilter === "All"
                            ? { backgroundColor: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }
                            : { backgroundColor: "#fff", color: "#000", borderColor: "#fff" }),
                        }}
                      >
                        <option value="All">State</option>
                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {(activeFilterCount > 0 || addressQuery || zipResult) && (
                        <button
                          onClick={() => { setChamberFilter("All"); setPartyFilter("All"); setStateFilter("All"); clearAddressFilter(); }}
                          className="px-3 py-1.5 text-sm uppercase tracking-wider cursor-pointer bg-transparent border-2 border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all"
                          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Inline scrollable virtualized results list */}
                    <div ref={listParentRef} className="max-h-80 overflow-y-auto rounded-xl border-2 border-white/10 bg-black/30">
                      {repsLoading || zipLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm font-bold text-white/60" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}>
                            {zipLoading ? "Looking Up Your District..." : "Loading Members of Congress..."}
                          </p>
                          {!zipLoading && <p className="text-xs text-white/30">535 representatives</p>}
                        </div>
                      ) : dropdownReps.length > 0 ? (
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const rep = dropdownReps[virtualRow.index];
                            const party = partyConfig(rep.party);
                            const partyColor = rep.party === "R" ? "#dc2626" : rep.party === "D" ? "#2563eb" : "#9333ea";
                            const isRepSelected = selectedReps.some((r) => r.id === rep.id);
                            return (
                              <div
                                key={rep.id}
                                data-index={virtualRow.index}
                                ref={rowVirtualizer.measureElement}
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${virtualRow.start}px)` }}
                              >
                                <div
                                  onClick={() => {
                                    setSelectedReps((prev) => {
                                      const exists = prev.some((r) => r.id === rep.id);
                                      return exists ? prev.filter((r) => r.id !== rep.id) : [...prev, rep];
                                    });
                                    setStep(3);
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  className={`w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer transition-colors border-b border-white/5`}
                                  style={{
                                    backgroundColor: isRepSelected ? `${partyColor}40` : `${partyColor}25`,
                                    boxShadow: isRepSelected ? `inset 3px 0 0 ${partyColor}` : "none",
                                  }}
                                  onMouseEnter={(e) => { if (!isRepSelected) e.currentTarget.style.backgroundColor = `${partyColor}35`; }}
                                  onMouseLeave={(e) => { if (!isRepSelected) e.currentTarget.style.backgroundColor = `${partyColor}25`; }}
                                >
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative border-2"
                                    style={{ borderColor: `${partyColor}60`, background: `linear-gradient(135deg, ${partyColor}30, ${partyColor}10)` }}
                                  >
                                    <span className="text-white text-xs font-bold">{rep.firstName[0]}{rep.lastName[0]}</span>
                                    {rep.photoUrl && (
                                      <Image src={rep.photoUrl} alt="" fill sizes="48px" className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    )}
                                  </div>
                                  <span className="text-lg text-white flex-1 tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{rep.fullName}</span>
                                  <span className="text-sm text-white/50 tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                    {party.label.slice(0, 3)} · {rep.stateAbbr}{rep.district ? `-${rep.district}` : ""} · {rep.chamber}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isMyRep(rep.id)) { removeRep(rep.id); } else { saveRep(rep); }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer bg-transparent border-none transition-colors shrink-0"
                                    aria-label={isMyRep(rep.id) ? "Remove from My Reps" : "Save to My Reps"}
                                    title={isMyRep(rep.id) ? "Remove from My Reps" : "Save to My Reps"}
                                  >
                                    <Star className={`w-4 h-4 ${isMyRep(rep.id) ? "text-yellow-400 fill-yellow-400" : "text-white/20 hover:text-yellow-400"}`} />
                                  </button>
                                  {isRepSelected && <Check className="w-4 h-4 text-red-400 shrink-0" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-sm text-white/50">
                            {zipResult && !zipResult.state
                              ? "Couldn\u2019t find a district for that address. Try a full address or zip+4."
                              : "No representatives found. Try different filters."}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Selected reps pills */}
              {selectedReps.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm text-white/40 mb-2 uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {selectedReps.length === 1 ? "Selected representative" : `${selectedReps.length} representatives selected`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReps.map((rep) => {
                      const partyColor = rep.party === "R" ? "#dc2626" : rep.party === "D" ? "#2563eb" : "#9333ea";
                      return (
                        <div
                          key={rep.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border-2"
                          style={{ backgroundColor: `${partyColor}15`, borderColor: `${partyColor}40` }}
                        >
                          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 overflow-hidden relative border"
                            style={{ borderColor: `${partyColor}60`, background: `${partyColor}30` }}
                          >
                            <span className="text-white text-[10px] font-bold">{rep.firstName[0]}{rep.lastName[0]}</span>
                            {rep.photoUrl && (
                              <Image src={rep.photoUrl} alt="" fill sizes="48px" className="object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            )}
                          </div>
                          <span className="text-base text-white tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{rep.fullName}</span>
                          <button
                            onClick={() => setSelectedReps((prev) => prev.filter((r) => r.id !== rep.id))}
                            className="text-white/40 hover:text-red-400 cursor-pointer bg-transparent border-none p-0 transition-colors"
                            aria-label={`Remove ${rep.fullName}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
            </Card>

            {/* Step 2: Choose how to reach them */}
            <div style={{ fontFamily: "'Bebas Neue', sans-serif" }}><Card padding="none" className="!bg-gradient-to-br !from-gray-950 !via-gray-900 !to-black !border-gray-800 !overflow-hidden relative">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />
              <div className="relative px-6 pt-6 pb-2">
                <h2 className="text-5xl lg:text-6xl tracking-wider text-center relative z-10 w-full" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#ffffff" }}>
                  How Do You Want To Reach Them?
                </h2>
                <p className="text-xl text-white/60 mb-0 mt-1 text-center tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  Select one or more.
                </p>
              </div>
              <div className="relative px-6 pb-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["letter", "call", "social"] as Mode[]).map((m) => {
                  const isSelected = selectedModes.has(m);
                  const videoLabel = m === "letter" ? "MAIL ($1.50)" : m === "call" ? "CALL (Free)" : "EMAIL (Free)";
                  const strokeColor = m === "letter" ? "#dc2626" : m === "call" ? "#2563eb" : "#eab308";
                  const selectedBorder = m === "letter" ? "border-red-500" : m === "call" ? "border-blue-500" : "border-yellow-500";
                  const cfg = modeConfig[m];
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedModes((prev) => {
                          const next = new Set(prev);
                          if (next.has(m)) {
                            if (next.size > 1) next.delete(m);
                          } else {
                            next.add(m);
                          }
                          return next;
                        });
                        setOutput("");
                      }}
                      className={`group relative text-left rounded-xl cursor-pointer border-2 overflow-hidden p-0
                        transition-all duration-300 ease-out
                        hover:scale-105 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1
                        active:scale-95 active:shadow-md
                        ${isSelected ? `${selectedBorder} ring-2 ring-white/30 scale-[1.02] shadow-lg` : "border-white/20 hover:border-white/40"}`}
                    >
                      <div>
                        <div className="py-2 text-center bg-black/80 transition-colors duration-300 group-hover:bg-black/90">
                          <span className="text-2xl tracking-[0.15em] uppercase transition-all duration-300 group-hover:tracking-[0.25em]" style={{ fontFamily: "'Bebas Neue', sans-serif", color: strokeColor, textShadow: `0 0 12px ${strokeColor}50` }}>{videoLabel}</span>
                        </div>
                        <video
                          src={cfg.civicIcon}
                          poster={cfg.civicPoster}
                          loop
                          muted
                          playsInline
                          preload="none"
                          className="w-full object-cover min-h-[100px] transition-all duration-300 group-hover:brightness-110 group-hover:contrast-110"
                          aria-hidden="true"
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          onTouchStart={(e) => {
                            const v = e.currentTarget;
                            if (v.paused) v.play(); else { v.pause(); v.currentTime = 0; }
                          }}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md animate-[bounce_0.4s_ease-out]">
                          <Check className="w-3.5 h-3.5" style={{ color: strokeColor }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              </div>
            </Card></div>

            {/* Step 3: What's on your mind? */}
            <Card padding="md" id="step-3-topics">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0
                  ${selectedRep ? "bg-navy text-white" : "bg-gray-200 text-gray-500"}`}>
                  3
                </div>
                <h2 className={`text-lg font-semibold ${selectedRep ? "text-navy" : "text-gray-400"}`}>
                  What&apos;s on your mind?
                </h2>
              </div>

              {/* Quick topics */}
              <p className="text-xs text-gray-500 mb-3">Pick a topic to get started</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {quickTopics.map((topic) => {
                  const isSelected = selectedIssueSlug === topic.slug;
                  return (
                    <button
                      key={topic.slug}
                      onClick={() => {
                        if (selectedIssueSlug === topic.slug) {
                          setSelectedIssueSlug("");
                          setConcern("");
                          return;
                        }
                        setSelectedIssueSlug(topic.slug);
                        const iss = getIssueBySlug(topic.slug);
                        if (iss && iss.talkingPoints.length > 0) {
                          setConcern(iss.talkingPoints[0]);
                        }
                        setTimeout(() => {
                          const ta = document.getElementById("draft-concern");
                          if (ta) { ta.scrollIntoView({ behavior: "smooth", block: "center" }); ta.focus(); }
                        }, 100);
                      }}
                      className={`flex items-center gap-2 p-3 rounded-xl text-left cursor-pointer transition-all border-2
                        ${isSelected ? "border-navy bg-navy-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <topic.Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-navy" : "text-gray-400"}`} />
                      <span className={`text-sm font-medium ${isSelected ? "text-navy" : "text-gray-600"}`}>
                        {topic.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Concern textarea */}
              <label
                htmlFor="draft-concern"
                className="text-xs text-gray-500 block mb-2 font-medium"
              >
                Write your letter or describe your concern
              </label>
              <textarea
                id="draft-concern"
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                placeholder="Write your full letter here, paste one you've already written, or just describe your concern and use 'Generate with AI' to draft it for you..."
                rows={4}
                className={`w-full px-4 py-3 text-sm rounded-xl border-2 focus:outline-none resize-none transition-all
                  ${selectedIssueSlug ? "border-navy bg-navy-50" : "border-gray-200 bg-gray-50 focus:border-navy focus:bg-white"}`}
              />
            </Card>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-light border border-red/20 rounded-xl text-sm text-red font-medium" role="alert">
                {error}
                {error.includes("API key") && (
                  <Link href="/settings" className="ml-2 underline text-red">Go to Settings</Link>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleUseOwn}
                disabled={!canGenerate}
                variant="outline"
                size="lg"
                className="flex-1"
                icon={<Send className="w-4 h-4" />}
              >
                {selectedReps.length === 0 ? "Pick a rep first" : !concern.trim() ? "Write your message" : selectedReps.length > 1 ? `Send to ${selectedReps.length} reps` : "Send as-is"}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading || !canGenerate}
                loading={loading}
                variant="primary"
                size="lg"
                className="flex-1"
                icon={!loading ? <Sparkles className="w-4 h-4" /> : undefined}
              >
                {loading ? "Drafting..." : "Generate with AI"}
              </Button>
            </div>

            {/* Loading state */}
            {loading && (
              <Card padding="md" className="text-center">
                <svg className="animate-spin h-6 w-6 text-navy mx-auto mb-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-navy font-medium">Drafting your message...</p>
                <p className="text-xs text-gray-500 mt-1">
                  Using {selectedRep?.fullName}&apos;s voting record and committee data
                </p>
              </Card>
            )}
          </div>
        ) : (
          /* Output view */
          <div ref={outputRef} className="space-y-0">
            {/* Print-only header */}
            <div className="hidden" data-print-show data-print-header>
              <h1 style={{ fontSize: "18pt", marginBottom: "4pt" }}>
                {mode === "letter" ? "Letter" : mode === "call" ? "Call Script" : "Email"} to {selectedRep?.fullName}
              </h1>
              <p style={{ fontSize: "9pt", color: "#6B7280" }}>
                {selectedRep?.title} — {selectedRep?.state}{selectedRep?.district ? `, ${selectedRep.district}` : ""} — Generated {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Action bar */}
            <Card padding="md" className="rounded-b-none border-b-0" data-print-hide>
              <div className="mb-4">
                <p className="text-lg font-semibold text-navy">
                  Your Message to {selectedReps.length > 1 ? `${selectedReps.length} Representatives` : selectedRep?.fullName}
                </p>
                {selectedReps.length > 1 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedReps.map((r) => r.fullName).join(" · ")}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedIssue ? selectedIssue.name : "General concern"} — {selectedModes.size} delivery method{selectedModes.size > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedModes.has("letter") && selectedRep && (
                  <Button onClick={() => setMailModalOpen(true)} variant="primary" icon={<Mail className="w-4 h-4" />}>
                    {selectedReps.length > 1 ? `Mail ${selectedReps.length} Letters — $${(selectedReps.length * 1.5).toFixed(2)}` : "Mail Letter — $1.50"}
                  </Button>
                )}
                {selectedModes.has("call") && selectedRep && (
                  <a href={`tel:${selectedRep.offices?.[0]?.phone || ""}`}>
                    <Button variant="teal" icon={<Phone className="w-4 h-4" />}>Call Now</Button>
                  </a>
                )}
                {selectedModes.has("social") && (
                  <a href={getMailtoLink()}>
                    <Button variant="secondary" icon={<PenLine className="w-4 h-4" />}>Send Email</Button>
                  </a>
                )}
                {(selectedRep?.contactForm || selectedRep?.website) && (
                  <Button onClick={handleOpenContactForm} variant="outline" icon={<ExternalLink className="w-4 h-4" />}>
                    Copy &amp; Open Form
                  </Button>
                )}
                <Button onClick={handlePrint} variant="ghost" icon={<Printer className="w-4 h-4" />}>Print</Button>
                <Button onClick={handleCopy} variant="ghost" icon={<Copy className="w-4 h-4" />}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </Card>

            {/* Letter content */}
            <div className="p-6 md:p-8 bg-white border border-gray-200 border-t-0 rounded-b-xl" data-print-letter>
              <div className="text-sm leading-relaxed whitespace-pre-wrap max-w-3xl text-gray-800">
                {output}
              </div>
            </div>

            {/* Bottom actions */}
            <Card padding="md" className="mt-4" data-print-hide>
              <div className="flex gap-2 flex-wrap mb-4">
                {selectedModes.has("letter") && selectedRep && (
                  <Button onClick={() => setMailModalOpen(true)} variant="primary" icon={<Mail className="w-4 h-4" />}>
                    {selectedReps.length > 1 ? `Mail ${selectedReps.length} Letters` : "Mail Letter — $1.50"}
                  </Button>
                )}
                {selectedModes.has("call") && selectedRep && (
                  <a href={`tel:${selectedRep.offices?.[0]?.phone || ""}`}>
                    <Button variant="teal" icon={<Phone className="w-4 h-4" />}>Call Now</Button>
                  </a>
                )}
                {selectedModes.has("social") && (
                  <a href={getMailtoLink()}>
                    <Button variant="secondary" icon={<PenLine className="w-4 h-4" />}>Send Email</Button>
                  </a>
                )}
                <Button onClick={handleCopy} variant="outline" icon={<Copy className="w-4 h-4" />}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>

              {/* Next steps */}
              <div className="grid grid-cols-2 gap-3">
                {mode !== "call" && (
                  <button
                    onClick={() => { setSelectedModes(new Set(["call"])); setOutput(""); }}
                    className="p-3 text-left rounded-xl bg-gray-50 border border-gray-200 hover:border-navy cursor-pointer transition-all"
                  >
                    <Phone className="w-5 h-5 text-teal mb-1" />
                    <span className="block text-sm font-semibold text-navy">Call Too</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Letters + calls = 3x impact</span>
                  </button>
                )}
                {mode !== "social" && (
                  <button
                    onClick={() => { setSelectedModes(new Set(["social"])); setOutput(""); }}
                    className="p-3 text-left rounded-xl bg-gray-50 border border-gray-200 hover:border-navy cursor-pointer transition-all"
                  >
                    <PenLine className="w-5 h-5 text-gold-dark mb-1" />
                    <span className="block text-sm font-semibold text-navy">Email Too</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Add another channel</span>
                  </button>
                )}
                <button
                  onClick={() => { setOutput(""); setSelectedReps([]); }}
                  className="p-3 text-left rounded-xl bg-gray-50 border border-gray-200 hover:border-navy cursor-pointer transition-all"
                >
                  <Users className="w-5 h-5 text-navy mb-1" />
                  <span className="block text-sm font-semibold text-navy">Another Rep</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Both senators + house rep</span>
                </button>
                <button
                  onClick={() => { setOutput(""); setError(""); }}
                  className="p-3 text-left rounded-xl bg-gray-50 border border-gray-200 hover:border-navy cursor-pointer transition-all"
                >
                  <RotateCcw className="w-5 h-5 text-gray-500 mb-1" />
                  <span className="block text-sm font-semibold text-navy">Edit &amp; Redo</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Tweak and regenerate</span>
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-gray-400">
                Auto-saved to your{" "}
                <Link href="/my-reps" className="text-navy font-medium">contact log</Link>.
              </p>
            </Card>

          </div>
        )}

        {/* Account prompt */}
        {showAccountPrompt && !user && (
          <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
            <Card padding="md" className="shadow-xl border-gold/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center shrink-0">
                  <img src="/images/civic/icons/voter-reg.png" alt="" className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">Track Your Impact</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a free account to earn points, track letters, and build your civic profile.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => {
                        setShowAccountPrompt(false);
                        setAuthModalMessage("Your action was saved locally. Create an account to track it across devices!");
                        setShowAuthModal(true);
                      }}
                      variant="primary"
                      size="sm"
                      icon={<UserPlus className="w-3.5 h-3.5" />}
                    >
                      Sign Up Free
                    </Button>
                    <Button onClick={() => setShowAccountPrompt(false)} variant="ghost" size="sm">
                      Later
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mail Letter Modal */}
        {mailModalOpen && selectedRep && (
          <MailLetterModal
            isOpen={mailModalOpen}
            onClose={() => setMailModalOpen(false)}
            letterContent={output}
            rep={selectedRep}
            reps={selectedReps}
            contactLogId={lastLogId}
            issue={selectedIssue?.name || concern.slice(0, 50) || "General"}
          />
        )}
      </div>
    </div>
  );
}

export default function DraftPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-2">Write Congress</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <DraftInner />
    </Suspense>
  );
}
