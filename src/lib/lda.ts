import { cache, TTL } from "./cache";
import type { LobbyingFiling } from "@/data/types";
import { fuzzyNameMatch } from "./utils/string-match";
import { getMemberById } from "./members";

// LDA general issue code → human-readable label
const ISSUE_LABELS: Record<string, string> = {
  AGR: "Agriculture", BUD: "Budget/Appropriations", CAW: "Clean Air & Water",
  CDT: "Commodities", COM: "Communications/Broadcasting", CPI: "Computer Industry",
  CSP: "Consumer Issues", DEF: "Defense", DOC: "District of Columbia",
  ECN: "Economics/Econ Development", EDU: "Education", ENG: "Energy/Nuclear",
  ENV: "Environment/Superfund", FAM: "Family/Abortion/Adoption", FIN: "Financial Institutions",
  FIR: "Firearms/Guns", FOO: "Food Industry", FOR: "Foreign Relations",
  FUE: "Fuel/Gas/Oil", GAM: "Gaming/Gambling", GOV: "Government Issues",
  HCR: "Health Issues", HOM: "Homeland Security", HOU: "Housing",
  IMM: "Immigration", IND: "Indian/Native American", INS: "Insurance",
  INT: "Intelligence", LBR: "Labor Issues", LAW: "Law Enforcement/Crime",
  MAN: "Manufacturing", MIA: "Media/Publishing", MED: "Medical/Disease/Drugs",
  MMM: "Medicare/Medicaid", MON: "Minting/Money", NAT: "Natural Resources",
  PHA: "Pharmacy", POS: "Postal", RES: "Real Estate/Land Use",
  RET: "Retirement", ROD: "Roads/Highway", SCI: "Science/Technology",
  SMB: "Small Business", SPO: "Sports/Athletics", TAR: "Tariff/Trade",
  TAX: "Taxation/IRS", TEC: "Telecommunications", TOB: "Tobacco",
  TOR: "Torts", TRA: "Transportation", TRD: "Trade",
  TOU: "Travel/Tourism", URB: "Urban Development", UNM: "Unemployment",
  UTI: "Utilities", VET: "Veterans", WAS: "Waste/Hazardous",
  WEL: "Welfare",
};

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
        const clientDescription = filing.client?.general_description || filing.client?.description || "";
        const amount =
          typeof filing.income === "number" ? filing.income :
          typeof filing.expenses === "number" ? filing.expenses : 0;

        // Build the filing URL
        const filingUrl = id
          ? `https://lda.senate.gov/filings/${id}/`
          : "";

        // Extract lobbying activity details
        const activities = filing.lobbying_activities || [];
        const issueCodes: string[] = [];
        const issueLabels: string[] = [];
        const specificIssues: string[] = [];
        const billsLobbied: string[] = [];
        const lobbyists: string[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const act of activities) {
          if (act.general_issue_code) {
            issueCodes.push(act.general_issue_code);
            const label = ISSUE_LABELS[act.general_issue_code];
            if (label) issueLabels.push(label);
          }
          if (act.description) specificIssues.push(act.description);

          // Extract bill references from description text
          const billPattern = /(?:H\.R\.|S\.|H\.Res\.|S\.Res\.|H\.J\.Res\.|S\.J\.Res\.)\s*\d+/g;
          const descText = act.description || "";
          const matches = descText.match(billPattern);
          if (matches) billsLobbied.push(...matches);

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
          filingUrl,
          registrant,
          client,
          clientDescription,
          amount,
          filingYear: filing.filing_year || 2024,
          issueCodes: [...new Set(issueCodes)],
          issueLabels: [...new Set(issueLabels)],
          specificIssues: [...new Set(specificIssues)],
          billsLobbied: [...new Set(billsLobbied)],
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
