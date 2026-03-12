import { cache, TTL } from "./cache";
import type { FederalRegisterDocument } from "@/data/types";

const BASE = "https://www.federalregister.gov/api/v1/documents.json";

export async function getOpenCommentPeriods(
  keyword?: string
): Promise<FederalRegisterDocument[]> {
  const cacheKey = `fedreg:comments:${keyword || "all"}`;
  const cached = cache.get<FederalRegisterDocument[]>(cacheKey);
  if (cached) return cached;

  try {
    const today = new Date().toISOString().split("T")[0];
    const params = new URLSearchParams({
      "conditions[type][]": "PRORULE",
      "conditions[comment_date][gte]": today,
      per_page: "50",
      order: "comment_date",
    });
    if (keyword) {
      params.set("conditions[term]", keyword);
    }

    // Also fetch proposed rules and rules with open comments
    const url = `${BASE}?${params.toString()}&conditions[type][]=RULE`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const results: FederalRegisterDocument[] = (data.results || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc: any) => ({
        documentNumber: doc.document_number || "",
        type: doc.type === "Proposed Rule" ? "PRORULE" : doc.type === "Rule" ? "RULE" : "NOTICE",
        title: doc.title || "",
        abstract: doc.abstract || "",
        agencies: (doc.agencies || []).map((a: { name?: string }) => a.name || "Unknown Agency"),
        commentEndDate: doc.comment_end_date || null,
        publicationDate: doc.publication_date || "",
        htmlUrl: doc.html_url || "",
        pdfUrl: doc.pdf_url || "",
      })
    );

    cache.set(cacheKey, results, TTL.FED_REGISTER);
    return results;
  } catch (err) {
    console.error("Federal Register API error:", err);
    return [];
  }
}

export async function getRecentRules(limit = 20): Promise<FederalRegisterDocument[]> {
  const cacheKey = `fedreg:recent:${limit}`;
  const cached = cache.get<FederalRegisterDocument[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      "conditions[type][]": "RULE",
      per_page: String(limit),
      order: "newest",
    });

    const res = await fetch(`${BASE}?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: FederalRegisterDocument[] = (data.results || []).map((doc: any) => ({
      documentNumber: doc.document_number || "",
      type: "RULE" as const,
      title: doc.title || "",
      abstract: doc.abstract || "",
      agencies: (doc.agencies || []).map((a: { name?: string }) => a.name || "Unknown Agency"),
      commentEndDate: doc.comment_end_date || null,
      publicationDate: doc.publication_date || "",
      htmlUrl: doc.html_url || "",
      pdfUrl: doc.pdf_url || "",
    }));

    cache.set(cacheKey, results, TTL.FED_REGISTER);
    return results;
  } catch (err) {
    console.error("Federal Register API error:", err);
    return [];
  }
}
