"use client";

import { createContext, useContext, ReactNode } from "react";

interface MembershipContextType {
  openMembership: () => void;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export function MembershipProvider({
  children,
  openMembership,
}: {
  children: ReactNode;
  openMembership: () => void;
}) {
  return (
    <MembershipContext.Provider value={{ openMembership }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const ctx = useContext(MembershipContext);
  if (!ctx) {
    return { openMembership: () => {} };
  }
  return ctx;
}
