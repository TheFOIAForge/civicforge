"use client";

import { useState, useEffect, useCallback } from "react";
import type { Representative } from "@/data/types";

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(url: string | null): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

export function useMembers(filters?: {
  state?: string;
  chamber?: string;
  party?: string;
  search?: string;
}): UseDataResult<Representative[]> {
  const params = new URLSearchParams();
  if (filters?.state) params.set("state", filters.state);
  if (filters?.chamber) params.set("chamber", filters.chamber);
  if (filters?.party) params.set("party", filters.party);
  if (filters?.search) params.set("search", filters.search);

  const qs = params.toString();
  const url = `/api/members${qs ? `?${qs}` : ""}`;
  return useFetch<Representative[]>(url);
}

export function useLeadership(): UseDataResult<Representative[]> {
  return useFetch<Representative[]>("/api/members?leadership=true");
}

export function useFeatured(): UseDataResult<Representative[]> {
  return useFetch<Representative[]>("/api/members?featured=true");
}

export function useMember(slug: string | null): UseDataResult<Representative> {
  const url = slug ? `/api/members/${slug}` : null;
  return useFetch<Representative>(url);
}

export function useMemberFinance(bioguideId: string | null) {
  const url = bioguideId ? `/api/members/${bioguideId}/finance` : null;
  return useFetch<{
    totalFundraising: string;
    smallDollarPct: number;
    topDonors: Array<{ name: string; amount: string }>;
    topIndustries: Array<{ name: string; amount: string }>;
  }>(url);
}

export function useMemberVotes(bioguideId: string | null) {
  const url = bioguideId ? `/api/members/${bioguideId}/votes` : null;
  return useFetch<{
    votingRecord: Array<{ category: string; yea: number; nay: number }>;
    keyVotes: Array<{
      bill: string;
      title: string;
      date: string;
      vote: "YEA" | "NAY" | "ABSTAIN";
      brokeWithParty: boolean;
    }>;
    partyLoyalty: number;
    votesCast: number;
    missedVotes: number;
  }>(url);
}

export function useAddressLookup() {
  const [data, setData] = useState<Representative[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lookup?address=${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, lookup };
}
