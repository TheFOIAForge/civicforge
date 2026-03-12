import { cache, TTL } from "./cache";
import type { CommitteeHearing, Representative } from "@/data/types";
import { getMemberById } from "./members";

export async function getHearingsForMember(
  bioguideId: string
): Promise<CommitteeHearing[]> {
  const cacheKey = `hearings:${bioguideId}`;
  const cached = cache.get<CommitteeHearing[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) return [];

  const member = getMemberById(bioguideId);
  if (!member) return [];

  try {
    const chamber = member.chamber === "Senate" ? "senate" : "house";

    // Fetch recent hearings for this chamber
    const res = await fetch(
      `https://api.congress.gov/v3/hearing/119/${chamber}?api_key=${apiKey}&format=json&limit=100&sort=date+desc`
    );
    if (!res.ok) return [];

    const data = await res.json();
    const hearings = data.hearings || [];

    // Filter hearings to those from committees the member sits on
    const memberCommittees = (member.committees || []).map((c) => c.toLowerCase());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matched: CommitteeHearing[] = hearings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((h: any) => {
        const hearingChamber = h.chamber?.toLowerCase() || "";
        if (hearingChamber !== chamber && hearingChamber !== "joint") return false;

        // Check if any of the hearing's committees match the member's committees
        const committees = h.committees || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return committees.some((c: any) => {
          const committeeName = (c.name || "").toLowerCase();
          return memberCommittees.some(
            (mc) => committeeName.includes(mc) || mc.includes(committeeName)
          );
        });
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((h: any) => ({
        title: h.title || "Untitled Hearing",
        date: h.date || "",
        chamber: h.chamber === "Senate" ? "Senate" as const :
                 h.chamber === "House" ? "House" as const : "Joint" as const,
        committee: h.committees?.[0]?.name || "Unknown Committee",
        url: h.url ? `https://api.congress.gov${h.url}` :
             `https://www.congress.gov/event/119th-congress/hearings`,
      }))
      .slice(0, 15);

    cache.set(cacheKey, matched, TTL.HEARINGS);
    return matched;
  } catch (err) {
    console.error(`Hearings API error for ${bioguideId}:`, err);
    return [];
  }
}
