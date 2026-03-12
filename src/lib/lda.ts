import { cache, TTL } from "./cache";
import type { LobbyingFiling, Representative } from "@/data/types";
import { fuzzyNameMatch } from "./utils/string-match";
import { getMemberById } from "./members";

export async function getLobbyingForMember(
  bioguideId: string
): Promise<LobbyingFiling[]> {
  const cacheKey = `lda:${bioguideId}`;
  const cached = cache.get<LobbyingFiling[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.LDA_API_KEY;
  if (!apiKey) return [];

  const member = getMemberById(bioguideId);
  if (!member) return [];

  try {
    // Search by member's last name + state to find relevant filings
    // LDA API searches specific_issues text field
    const searchTerms = [member.lastName];

    const allFilings: LobbyingFiling[] = [];
    const seen = new Set<string>();

    for (const term of searchTerms) {
      const url = `https://lda.senate.gov/api/v1/filings/?search=${encodeURIComponent(term)}&filing_year=2024&filing_year=2025&page_size=25`;
      const res = await fetch(url, {
        headers: { Authorization: `Token ${apiKey}` },
      });
      if (!res.ok) continue;

      const data = await res.json();
      const results = data.results || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const filing of results) {
        const id = filing.filing_uuid || filing.url || "";
        if (seen.has(id)) continue;
        seen.add(id);

        const registrant = filing.registrant?.name || "";
        const client = filing.client?.name || "";
        const amount =
          typeof filing.income === "number" ? filing.income :
          typeof filing.expenses === "number" ? filing.expenses : 0;

        // Extract lobbying activity details
        const activities = filing.lobbying_activities || [];
        const issueCodes: string[] = [];
        const specificIssues: string[] = [];
        const lobbyists: string[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const act of activities) {
          if (act.general_issue_code) issueCodes.push(act.general_issue_code);
          if (act.description) specificIssues.push(act.description);
          for (const lob of act.lobbyists || []) {
            const name = lob.lobbyist?.name || `${lob.lobbyist?.first_name || ""} ${lob.lobbyist?.last_name || ""}`.trim();
            if (name) lobbyists.push(name);
          }
        }

        // Check if client matches any of the member's top donors
        const matchesDonor = (member.topDonors || []).some((d) =>
          fuzzyNameMatch(client, d.name)
        );

        allFilings.push({
          filingId: id,
          registrant,
          client,
          amount,
          filingYear: filing.filing_year || 2024,
          issueCodes: [...new Set(issueCodes)],
          specificIssues: [...new Set(specificIssues)],
          lobbyists: [...new Set(lobbyists)],
          matchesDonor,
        });
      }
    }

    // Sort: donor matches first, then by amount
    allFilings.sort((a, b) => {
      if (a.matchesDonor !== b.matchesDonor) return a.matchesDonor ? -1 : 1;
      return b.amount - a.amount;
    });

    const result = allFilings.slice(0, 20);
    cache.set(cacheKey, result, TTL.LOBBYING);
    return result;
  } catch (err) {
    console.error(`LDA API error for ${bioguideId}:`, err);
    return [];
  }
}
