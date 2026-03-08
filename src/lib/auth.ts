/**
 * auth.ts
 *
 * Client-side auth layer backed by localStorage.
 *
 * Passwords are hashed with SHA-256 (Web Crypto API) before storage.
 * This prevents trivial plaintext exposure but is NOT a substitute for
 * a real server-side auth system — anyone with access to the machine can
 * still inspect and manipulate localStorage directly.
 */

import { v4 as uuidv4 } from 'uuid';
import { User, Session } from '../types';
import { storage, STORAGE_KEYS } from './storage';

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

/** Returns the hex-encoded SHA-256 digest of the given string. */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

function getUsers(): User[] {
  return storage.get<User[]>(STORAGE_KEYS.USERS) ?? [];
}

function saveUsers(users: User[]): void {
  storage.set(STORAGE_KEYS.USERS, users);
}

export function getAllUsers(): User[] {
  return getUsers();
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export type RegisterResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

export async function register(
  email: string,
  password: string,
): Promise<RegisterResult> {
  const emailTrimmed = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    return { ok: false, error: 'Invalid email address.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }

  const users = getUsers();
  if (users.some((u) => u.email === emailTrimmed)) {
    return { ok: false, error: 'An account with that email already exists.' };
  }

  const passwordHash = await hashPassword(password);
  const user: User = {
    id: uuidv4(),
    email: emailTrimmed,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);
  return { ok: true, user };
}

// ---------------------------------------------------------------------------
// Login / logout
// ---------------------------------------------------------------------------

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; error: string };

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const emailTrimmed = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((u) => u.email === emailTrimmed);

  if (!user) {
    return { ok: false, error: 'No account found with that email.' };
  }

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    return { ok: false, error: 'Incorrect password.' };
  }

  const session: Session = {
    userId: user.id,
    email: user.email,
    loginTime: new Date().toISOString(),
  };
  storage.set(STORAGE_KEYS.SESSION, session);
  return { ok: true, session };
}

export function logout(): void {
  storage.remove(STORAGE_KEYS.SESSION);
}

export function getSession(): Session | null {
  return storage.get<Session>(STORAGE_KEYS.SESSION);
}

/** Derive a display name from an email (everything before @). */
export function displayName(email: string): string {
  return email.split('@')[0];
}
