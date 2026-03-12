// Transforms Google Civic Information API response into bioguide-matchable data

export interface CivicOfficial {
  name: string;
  party?: string;
  phones?: string[];
  urls?: string[];
  photoUrl?: string;
  channels?: Array<{ type: string; id: string }>;
}

export interface CivicResponse {
  offices: Array<{
    name: string;
    divisionId: string;
    officialIndices: number[];
  }>;
  officials: CivicOfficial[];
}

export interface CivicRepResult {
  name: string;
  office: string;
  party?: string;
  divisionId: string;
}

export function transformCivicResponse(data: CivicResponse): CivicRepResult[] {
  const results: CivicRepResult[] = [];

  for (const office of data.offices) {
    // Only include federal offices
    const div = office.divisionId;
    const isFederal =
      div === "ocd-division/country:us" ||
      div.match(/^ocd-division\/country:us\/state:\w+$/) ||
      div.match(/^ocd-division\/country:us\/state:\w+\/cd:\d+$/);

    if (!isFederal) continue;

    // Skip President/VP
    const name = office.name.toLowerCase();
    if (name.includes("president") || name.includes("vice president")) continue;

    for (const idx of office.officialIndices) {
      const official = data.officials[idx];
      if (official) {
        results.push({
          name: official.name,
          office: office.name,
          party: official.party,
          divisionId: office.divisionId,
        });
      }
    }
  }

  return results;
}
