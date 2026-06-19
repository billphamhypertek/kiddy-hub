import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Profile } from '../data/types';

interface SessionValue {
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  return (
    <SessionContext.Provider value={{ profile, setProfile }}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
