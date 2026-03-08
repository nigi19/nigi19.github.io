import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Session } from '../types';
import { getSession, logout as doLogout } from '../lib/auth';

interface AuthContextValue {
  session: Session | null;
  refreshSession: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(getSession);

  function refreshSession() {
    setSession(getSession());
  }

  function logout() {
    doLogout();
    setSession(null);
  }

  // Sync if another tab logs out (storage event).
  useEffect(() => {
    function handleStorage() {
      setSession(getSession());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ session, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
