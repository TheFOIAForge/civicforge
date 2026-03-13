"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type UserMode = "activist" | "informed" | "power";

const MODE_RANK: Record<UserMode, number> = {
  activist: 0,
  informed: 1,
  power: 2,
};

export function modeAtLeast(current: UserMode, required: UserMode): boolean {
  return MODE_RANK[current] >= MODE_RANK[required];
}

interface UserModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  modeAtLeast: (required: UserMode) => boolean;
  isOnboarded: boolean;
  completeOnboarding: () => void;
}

const STORAGE_KEY = "checkmyrep_user_mode";
const ONBOARDING_KEY = "checkmyrep_onboarding_done";

const UserModeContext = createContext<UserModeContextType>({
  mode: "power",
  setMode: () => {},
  modeAtLeast: () => true,
  isOnboarded: true,
  completeOnboarding: () => {},
});

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UserMode>("power");
  const [isOnboarded, setIsOnboarded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as UserMode | null;
    if (stored && MODE_RANK[stored] !== undefined) {
      setModeState(stored);
    }
    setIsOnboarded(localStorage.getItem(ONBOARDING_KEY) === "true");
    setMounted(true);
  }, []);

  const setMode = useCallback((newMode: UserMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOnboarded(true);
    localStorage.setItem(ONBOARDING_KEY, "true");
  }, []);

  const checkMode = useCallback(
    (required: UserMode) => modeAtLeast(mode, required),
    [mode]
  );

  // Prevent flash — render children immediately but with default "power" mode
  // so existing users never see a layout shift
  if (!mounted) {
    return (
      <UserModeContext.Provider
        value={{
          mode: "power",
          setMode,
          modeAtLeast: () => true,
          isOnboarded: true,
          completeOnboarding,
        }}
      >
        {children}
      </UserModeContext.Provider>
    );
  }

  return (
    <UserModeContext.Provider
      value={{
        mode,
        setMode,
        modeAtLeast: checkMode,
        isOnboarded,
        completeOnboarding,
      }}
    >
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  return useContext(UserModeContext);
}
