const STRIP_SUFFIXES = [
  "inc", "llc", "corp", "corporation", "company", "co", "ltd",
  "pac", "committee", "political action committee",
  "for america", "of america", "usa", "us",
  "the", "and", "group", "holdings", "international",
];

function normalize(name: string): string {
  let n = name.toLowerCase().trim();
  // Remove punctuation
  n = n.replace(/[.,\-'"/()]/g, " ");
  // Remove common suffixes
  for (const suffix of STRIP_SUFFIXES) {
    n = n.replace(new RegExp(`\\b${suffix}\\b`, "g"), "");
  }
  // Collapse whitespace
  return n.replace(/\s+/g, " ").trim();
}

export function fuzzyNameMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Check if one contains the other (for "Koch Industries" vs "Koch Industries Inc")
  if (na.includes(nb) || nb.includes(na)) return true;
  // Check if the shorter string's words are all in the longer one
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  const words = shorter.split(" ").filter((w) => w.length > 2);
  if (words.length === 0) return false;
  const matchCount = words.filter((w) => longer.includes(w)).length;
  return matchCount / words.length >= 0.8;
}

export function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}
