import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Session as SupabaseSession } from '@supabase/supabase-js';
import { Session } from '../types';
import { supabase } from '../lib/supabase';
import { logout as doLogout } from '../lib/auth';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(s: SupabaseSession | null): Session | null {
  if (!s) return null;
  return { userId: s.user.id, email: s.user.email ?? '' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(toSession(data.session));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(toSession(s));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await doLogout();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
