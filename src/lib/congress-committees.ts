import { cache, TTL } from "./cache";
import type { Committee, CommitteeHearing } from "@/data/types";
import { getAllMembers } from "./members";

const CONGRESS = 119;

/** Convert committee name to URL-safe slug */
export function committeeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Fetch all committees for the current Congress */
export async function getAllCommittees(): Promise<Committee[]> {
  const cacheKey = "committees:all";
  const cached = cache.get<Committee[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) return [];

  try {
    // Fetch Senate + House + Joint committees in parallel
    const [senateRes, houseRes, jointRes] = await Promise.all([
      fetch(`https://api.congress.gov/v3/committee/${CONGRESS}/senate?api_key=${apiKey}&format=json&limit=100`),
      fetch(`https://api.congress.gov/v3/committee/${CONGRESS}/house?api_key=${apiKey}&format=json&limit=100`),
      fetch(`https://api.congress.gov/v3/committee/${CONGRESS}/joint?api_key=${apiKey}&format=json&limit=50`),
    ]);

    const committees: Committee[] = [];

    for (const [res, chamber] of [
      [senateRes, "Senate"],
      [houseRes, "House"],
      [jointRes, "Joint"],
    ] as const) {
      if (!res.ok) continue;
      const data = await res.json();
      const items = data.committees || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const c of items) {
        const name = c.name || "";
        if (!name) continue;

        // Only include current committees, skip subcommittees at top level
        if (c.committeeTypeCode === "Subcommittee") continue;

        const systemCode = c.systemCode || "";
        const slug = committeeSlug(name);

        // Extract subcommittees
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subcommittees = (c.subcommittees || []).map((sc: any) => ({
          name: sc.name || "",
          systemCode: sc.systemCode || "",
        }));

        committees.push({
          systemCode,
          name,
          slug,
          chamber,
          url: `https://www.congress.gov/committee/${chamber.toLowerCase()}/${systemCode}`,
          subcommittees,
          members: [],
          recentHearings: [],
          websiteUrl: c.committeeWebsiteUrl || undefined,
        });
      }
    }

    // Cross-reference with our member data to populate committee members
    // Matching is fuzzy because Congress.gov names differ from our local data
    // Congress.gov: "Finance Committee" vs local: "Senate Committee on Finance"
    function coreWords(name: string): string[] {
      return name
        .toLowerCase()
        .replace(/committee/g, "")
        .replace(/\b(on|of|the|and|for|in|to|select|special|permanent)\b/g, "")
        .replace(/\b(senate|house|joint)\b/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2);
    }

    const allMembers = getAllMembers();
    for (const committee of committees) {
      const cWords = coreWords(committee.name);
      const cNameLower = committee.name.toLowerCase();

      const members = allMembers.filter((m) =>
        (m.committees || []).some((mc) => {
          const mcLower = mc.toLowerCase();
          // Direct includes (either direction)
          if (mcLower.includes(cNameLower) || cNameLower.includes(mcLower)) return true;
          // Fuzzy: check if core words of the committee name appear in the member's committee string
          const mcWords = coreWords(mc);
          const matchCount = cWords.filter(w => mcWords.includes(w)).length;
          return cWords.length > 0 && matchCount >= Math.min(cWords.length, 2) && matchCount / cWords.length >= 0.6;
        })
      );

      committee.members = members.map((m) => ({
        name: m.fullName,
        bioguideId: m.id,
        party: m.party,
        role: "Member",
        slug: m.slug,
      }));
    }

    // Sort by chamber then name
    committees.sort((a, b) => {
      const chamberOrder = { Senate: 0, House: 1, Joint: 2 };
      const co = (chamberOrder[a.chamber] || 0) - (chamberOrder[b.chamber] || 0);
      if (co !== 0) return co;
      return a.name.localeCompare(b.name);
    });

    cache.set(cacheKey, committees, TTL.HEARINGS); // 1 hour
    return committees;
  } catch (err) {
    console.error("Congress.gov committee API error:", err);
    return [];
  }
}

/** Get a specific committee by slug with full details */
export async function getCommitteeBySlug(slug: string): Promise<Committee | null> {
  const all = await getAllCommittees();
  const committee = all.find((c) => c.slug === slug);
  if (!committee) return null;

  // Try to fetch recent hearings for this committee
  const cacheKey = `committee-hearings:${slug}`;
  const cachedHearings = cache.get<CommitteeHearing[]>(cacheKey);
  if (cachedHearings) {
    committee.recentHearings = cachedHearings;
    return committee;
  }

  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (apiKey) {
    try {
      const chamber = committee.chamber === "Senate" ? "senate" : committee.chamber === "House" ? "house" : "joint";
      const res = await fetch(
        `https://api.congress.gov/v3/hearing/${CONGRESS}/${chamber}?api_key=${apiKey}&format=json&limit=50&sort=date+desc`
      );
      if (res.ok) {
        const data = await res.json();
        const hearings = data.hearings || [];

        const nameLower = committee.name.toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matched: CommitteeHearing[] = hearings
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((h: any) => {
            const hCommittees = h.committees || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return hCommittees.some((c: any) => {
              const cn = (c.name || "").toLowerCase();
              return cn.includes(nameLower) || nameLower.includes(cn);
            });
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((h: any) => ({
            title: h.title || "Untitled Hearing",
            date: h.date || "",
            chamber: h.chamber === "Senate" ? "Senate" as const :
                     h.chamber === "House" ? "House" as const : "Joint" as const,
            committee: committee.name,
            url: h.url ? `https://api.congress.gov${h.url}` :
                 `https://www.congress.gov/event/${CONGRESS}th-congress/hearings`,
          }))
          .slice(0, 15);

        committee.recentHearings = matched;
        cache.set(cacheKey, matched, TTL.HEARINGS);
      }
    } catch (err) {
      console.error(`Hearings fetch error for ${slug}:`, err);
    }
  }

  return committee;
}
