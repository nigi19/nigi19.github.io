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
import { getDisplayName } from '../lib/profiles';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  displayName: string;
  refreshDisplayName: () => void;
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
  const [displayName, setDisplayName] = useState('');

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

  // Fetch display name whenever the logged-in user changes.
  useEffect(() => {
    if (!session) { setDisplayName(''); return; }
    getDisplayName(session.userId).then((name) => {
      setDisplayName(name ?? session.email.split('@')[0]);
    });
  }, [session?.userId]);

  function refreshDisplayName() {
    if (!session) return;
    getDisplayName(session.userId).then((name) => {
      setDisplayName(name ?? session.email.split('@')[0]);
    });
  }

  async function logout() {
    await doLogout();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, displayName, refreshDisplayName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
