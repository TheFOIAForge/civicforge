"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Representative } from "@/data/types";

interface MyRepsContextType {
  myReps: Representative[];
  savedRepIds: string[];
  saveRep: (rep: Representative) => void;
  removeRep: (repId: string) => void;
  isMyRep: (repId: string) => boolean;
  clearMyReps: () => void;
  hasSavedReps: boolean;
}

const MyRepsContext = createContext<MyRepsContextType>({
  myReps: [],
  savedRepIds: [],
  saveRep: () => {},
  removeRep: () => {},
  isMyRep: () => false,
  clearMyReps: () => {},
  hasSavedReps: false,
});

const STORAGE_KEY = "checkmyrep_my_reps";

export function MyRepsProvider({ children }: { children: ReactNode }) {
  const [myReps, setMyReps] = useState<Representative[]>([]);
  const [savedRepIds, setSavedRepIds] = useState<string[]>([]);

  // Load on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Representative[];
        setMyReps(parsed);
        setSavedRepIds(parsed.map((r) => r.id));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const persist = useCallback((reps: Representative[]) => {
    setMyReps(reps);
    setSavedRepIds(reps.map((r) => r.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reps));
  }, []);

  const saveRep = useCallback(
    (rep: Representative) => {
      if (myReps.some((r) => r.id === rep.id)) return;
      persist([...myReps, rep]);
    },
    [myReps, persist]
  );

  const removeRep = useCallback(
    (repId: string) => {
      persist(myReps.filter((r) => r.id !== repId));
    },
    [myReps, persist]
  );

  const isMyRep = useCallback(
    (repId: string) => savedRepIds.includes(repId),
    [savedRepIds]
  );

  const clearMyReps = useCallback(() => {
    persist([]);
  }, [persist]);

  return (
    <MyRepsContext.Provider
      value={{
        myReps,
        savedRepIds,
        saveRep,
        removeRep,
        isMyRep,
        clearMyReps,
        hasSavedReps: myReps.length > 0,
      }}
    >
      {children}
    </MyRepsContext.Provider>
  );
}

export function useMyReps() {
  return useContext(MyRepsContext);
}
