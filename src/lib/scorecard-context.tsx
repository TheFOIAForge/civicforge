"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Representative, UserVote } from "@/data/types";

interface AlignmentDetail {
  billId: string;
  billTitle: string;
  userVote: "YEA" | "NAY";
  repVote: "YEA" | "NAY" | "ABSTAIN" | null;
  matched: boolean;
}

interface AlignmentResult {
  score: number;
  matched: number;
  total: number;
  details: AlignmentDetail[];
}

interface ScorecardContextType {
  userVotes: UserVote[];
  addVote: (billId: string, billTitle: string, position: "YEA" | "NAY", category?: string) => void;
  removeVote: (billId: string) => void;
  getAlignment: (rep: Representative) => AlignmentResult;
  hasVoted: (billId: string) => "YEA" | "NAY" | null;
}

const ScorecardContext = createContext<ScorecardContextType>({
  userVotes: [],
  addVote: () => {},
  removeVote: () => {},
  getAlignment: () => ({ score: 0, matched: 0, total: 0, details: [] }),
  hasVoted: () => null,
});

const STORAGE_KEY = "checkmyrep_user_votes";

function normalizeBillId(bill: string): string {
  return bill.replace(/[.\s]/g, "").toLowerCase();
}

export function ScorecardProvider({ children }: { children: ReactNode }) {
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);

  // Load on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserVote[];
        setUserVotes(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const persist = useCallback((votes: UserVote[]) => {
    setUserVotes(votes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  }, []);

  const addVote = useCallback(
    (billId: string, billTitle: string, position: "YEA" | "NAY", category?: string) => {
      const existing = userVotes.findIndex((v) => v.billId === billId);
      const vote: UserVote = {
        billId,
        billTitle,
        userPosition: position,
        date: new Date().toISOString().split("T")[0],
        category,
      };
      if (existing >= 0) {
        const updated = [...userVotes];
        updated[existing] = vote;
        persist(updated);
      } else {
        persist([...userVotes, vote]);
      }
    },
    [userVotes, persist]
  );

  const removeVote = useCallback(
    (billId: string) => {
      persist(userVotes.filter((v) => v.billId !== billId));
    },
    [userVotes, persist]
  );

  const hasVoted = useCallback(
    (billId: string): "YEA" | "NAY" | null => {
      const vote = userVotes.find((v) => v.billId === billId);
      return vote ? vote.userPosition : null;
    },
    [userVotes]
  );

  const getAlignment = useCallback(
    (rep: Representative): AlignmentResult => {
      const details: AlignmentDetail[] = [];
      let matched = 0;
      let total = 0;

      for (const uv of userVotes) {
        const normalizedUserBill = normalizeBillId(uv.billId);
        const repKeyVote = rep.keyVotes.find(
          (kv) => normalizeBillId(kv.bill) === normalizedUserBill
        );

        if (repKeyVote) {
          total++;
          const isMatch = uv.userPosition === repKeyVote.vote;
          if (isMatch) matched++;

          details.push({
            billId: uv.billId,
            billTitle: uv.billTitle,
            userVote: uv.userPosition,
            repVote: repKeyVote.vote,
            matched: isMatch,
          });
        } else {
          details.push({
            billId: uv.billId,
            billTitle: uv.billTitle,
            userVote: uv.userPosition,
            repVote: null,
            matched: false,
          });
        }
      }

      const score = total > 0 ? Math.round((matched / total) * 100) : 0;

      return { score, matched, total, details };
    },
    [userVotes]
  );

  return (
    <ScorecardContext.Provider
      value={{
        userVotes,
        addVote,
        removeVote,
        getAlignment,
        hasVoted,
      }}
    >
      {children}
    </ScorecardContext.Provider>
  );
}

export function useScorecard() {
  return useContext(ScorecardContext);
}
