import { supabase } from './supabase';

export type RegisterResult =
  | { ok: true; autoLoggedIn: boolean }
  | { ok: false; error: string };

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

export async function register(
  email: string,
  password: string,
): Promise<RegisterResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, autoLoggedIn: !!data.session };
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/** Derive a display name from an email (everything before @). */
export function displayName(email: string): string {
  return email.split('@')[0];
}
