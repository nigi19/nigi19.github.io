/**
 * storage.ts
 *
 * Thin, typed wrappers around localStorage.
 *
 * All data is stored as JSON strings. Version suffixes on keys allow
 * future schema migrations without colliding with old data.
 *
 * SECURITY NOTE: localStorage is readable by any JavaScript running on
 * the same origin and by anyone with physical access to the machine.
 * This storage layer is intentionally simple and NOT suitable for
 * genuinely sensitive data.
 */

export const STORAGE_KEYS = {
  USERS: 'beertracker_users_v1',
  SESSION: 'beertracker_session_v1',
  LOGS: 'beertracker_logs_v1',
  CUSTOM_BEERS: 'beertracker_custom_beers_v1',
} as const;

function get<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string): void {
  localStorage.removeItem(key);
}

export const storage = { get, set, remove };
