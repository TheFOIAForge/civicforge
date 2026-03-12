interface ApiCall {
  id: string;
  source: string;
  params: Record<string, string>;
}

interface FetchPlan {
  calls: ApiCall[];
}

type ProgressCallback = (completed: number, total: number, current: string) => void;

const SOURCE_LABELS: Record<string, string> = {
  MEMBERS_SEARCH: "Members of Congress",
  MEMBER_DETAIL: "Member Profile",
  MEMBER_FINANCE: "Campaign Finance",
  MEMBER_LOBBYING: "Lobbying Data",
  MEMBER_DARK_MONEY: "Dark Money",
  MEMBER_HEARINGS: "Committee Hearings",
  MEMBER_SPENDING: "Federal Spending",
  MEMBER_VOTES: "Voting Stats",
  FEDERAL_REGISTER: "Federal Register",
  GAO_REPORTS: "GAO Reports",
};

function buildUrl(source: string, params: Record<string, string>): string {
  switch (source) {
    case "MEMBERS_SEARCH": {
      const sp = new URLSearchParams();
      if (params.search) sp.set("search", params.search);
      if (params.state) sp.set("state", params.state);
      if (params.chamber) sp.set("chamber", params.chamber);
      if (params.party) sp.set("party", params.party);
      if (params.leadership) sp.set("leadership", params.leadership);
      return `/api/members?${sp}`;
    }
    case "MEMBER_DETAIL":
      return `/api/members/${params.bioguideId}`;
    case "MEMBER_FINANCE":
      return `/api/members/${params.bioguideId}/finance`;
    case "MEMBER_LOBBYING":
      return `/api/members/${params.bioguideId}/lobbying`;
    case "MEMBER_DARK_MONEY":
      return `/api/members/${params.bioguideId}/dark-money`;
    case "MEMBER_HEARINGS":
      return `/api/members/${params.bioguideId}/hearings`;
    case "MEMBER_SPENDING":
      return `/api/members/${params.bioguideId}/spending`;
    case "MEMBER_VOTES":
      return `/api/members/${params.bioguideId}/votes`;
    case "FEDERAL_REGISTER": {
      const sp = new URLSearchParams();
      if (params.keyword) sp.set("keyword", params.keyword);
      if (params.mode) sp.set("mode", params.mode);
      return `/api/federal-register?${sp}`;
    }
    case "GAO_REPORTS": {
      const sp = new URLSearchParams();
      if (params.keyword) sp.set("keyword", params.keyword);
      if (params.limit) sp.set("limit", params.limit);
      return `/api/gao-reports?${sp}`;
    }
    default:
      return "";
  }
}

function resolveRef(ref: string, results: Map<string, unknown>): string {
  // Parse "from:search1[0].id" → get results["search1"][0].id
  const match = ref.match(/^from:(\w+)(\[(\d+)\])?\.(.+)$/);
  if (!match) return ref;

  const [, callId, , indexStr, path] = match;
  const data = results.get(callId);
  if (!data) return ref;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let target: any = data;
  if (indexStr !== undefined) {
    if (Array.isArray(target)) {
      target = target[parseInt(indexStr)];
    } else if (target && typeof target === "object" && Array.isArray((target as Record<string, unknown>).members)) {
      target = (target as Record<string, unknown[]>).members[parseInt(indexStr)];
    }
  }

  if (!target) return ref;

  const parts = path.split(".");
  for (const p of parts) {
    if (target && typeof target === "object") {
      target = (target as Record<string, unknown>)[p];
    } else {
      return ref;
    }
  }

  return String(target || ref);
}

export async function executePlan(
  plan: FetchPlan,
  onProgress?: ProgressCallback
): Promise<Map<string, unknown>> {
  const results = new Map<string, unknown>();
  const total = plan.calls.length;
  let completed = 0;

  // Separate calls into dependency groups
  const independent: ApiCall[] = [];
  const dependent: ApiCall[] = [];

  for (const call of plan.calls) {
    const hasRef = Object.values(call.params).some(
      (v) => typeof v === "string" && v.startsWith("from:")
    );
    if (hasRef) {
      dependent.push(call);
    } else {
      independent.push(call);
    }
  }

  // Execute independent calls in parallel
  if (independent.length > 0) {
    await Promise.all(
      independent.map(async (call) => {
        onProgress?.(completed, total, SOURCE_LABELS[call.source] || call.source);
        try {
          const url = buildUrl(call.source, call.params);
          if (!url) return;
          const res = await fetch(url);
          if (res.ok) {
            results.set(call.id, await res.json());
          }
        } catch {
          // Skip failed calls
        }
        completed++;
        onProgress?.(completed, total, SOURCE_LABELS[call.source] || call.source);
      })
    );
  }

  // Execute dependent calls sequentially (they reference previous results)
  for (const call of dependent) {
    onProgress?.(completed, total, SOURCE_LABELS[call.source] || call.source);
    try {
      // Resolve references in params
      const resolvedParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(call.params)) {
        resolvedParams[key] =
          typeof value === "string" && value.startsWith("from:")
            ? resolveRef(value, results)
            : value;
      }

      const url = buildUrl(call.source, resolvedParams);
      if (url && !resolvedParams.bioguideId?.startsWith("from:")) {
        const res = await fetch(url);
        if (res.ok) {
          results.set(call.id, await res.json());
        }
      }
    } catch {
      // Skip failed calls
    }
    completed++;
    onProgress?.(completed, total, SOURCE_LABELS[call.source] || call.source);
  }

  return results;
}

export function buildDataContext(results: Map<string, unknown>): string {
  const sections: string[] = [];

  for (const [callId, data] of results) {
    const json = JSON.stringify(data, null, 1);
    // Truncate very large responses to keep context manageable
    const truncated = json.length > 8000 ? json.slice(0, 8000) + "\n... (truncated)" : json;
    sections.push(`=== DATA FROM ${callId} ===\n${truncated}`);
  }

  return sections.join("\n\n");
}

export function parsePlanResponse(text: string): FetchPlan {
  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return { calls: [] };

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.calls && Array.isArray(parsed.calls)) {
      return { calls: parsed.calls.slice(0, 8) };
    }
    return { calls: [] };
  } catch {
    return { calls: [] };
  }
}
