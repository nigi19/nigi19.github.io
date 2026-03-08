/**
 * stats.ts
 *
 * Pure functions for computing leaderboard rankings and personal stats
 * from a list of DrinkLog entries.
 */

import { DrinkLog, RankingEntry, TimeRange, User } from '../types';
import { filterByDateRange } from './dates';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Group logs by userId within the given time range. */
function groupByUser(
  logs: DrinkLog[],
  _users: User[],
  range: TimeRange,
): Map<string, DrinkLog[]> {
  const filtered = filterByDateRange(logs, range);
  const map = new Map<string, DrinkLog[]>();
  for (const log of filtered) {
    const existing = map.get(log.userId) ?? [];
    existing.push(log);
    map.set(log.userId, existing);
  }
  return map;
}

/** Build a sorted RankingEntry array from a userId→value map. */
function toRanking(
  valueMap: Map<string, number>,
  users: User[],
  format: (v: number) => string,
): RankingEntry[] {
  const userIndex = new Map(users.map((u) => [u.id, u]));
  return Array.from(valueMap.entries())
    .map(([userId, value]) => {
      const user = userIndex.get(userId);
      return {
        userId,
        email: user?.email ?? userId,
        value,
        formattedValue: format(value),
      };
    })
    .sort((a, b) => b.value - a.value || a.email.localeCompare(b.email));
}

// ---------------------------------------------------------------------------
// Leaderboard functions
// ---------------------------------------------------------------------------

/** Ranking by total volume consumed (shown in litres). */
export function getMostVolumeRanking(
  logs: DrinkLog[],
  users: User[],
  range: TimeRange,
): RankingEntry[] {
  const byUser = groupByUser(logs, users, range);
  const valueMap = new Map<string, number>();
  for (const [userId, userLogs] of byUser) {
    const totalMl = userLogs.reduce((sum, l) => sum + l.volumeMl, 0);
    valueMap.set(userId, totalMl);
  }
  return toRanking(valueMap, users, (v) => `${(v / 1000).toFixed(1)} L`);
}

/** Ranking by number of individual logs (drinks). */
export function getMostBeersRanking(
  logs: DrinkLog[],
  users: User[],
  range: TimeRange,
): RankingEntry[] {
  const byUser = groupByUser(logs, users, range);
  const valueMap = new Map<string, number>();
  for (const [userId, userLogs] of byUser) {
    valueMap.set(userId, userLogs.length);
  }
  return toRanking(valueMap, users, (v) =>
    v === 1 ? '1 beer' : `${v} beers`,
  );
}

/** Ranking by the single highest-ABV beer consumed. */
export function getHighestAbvRanking(
  logs: DrinkLog[],
  users: User[],
  range: TimeRange,
): RankingEntry[] {
  const byUser = groupByUser(logs, users, range);
  const valueMap = new Map<string, number>();
  for (const [userId, userLogs] of byUser) {
    const max = Math.max(...userLogs.map((l) => l.abv));
    valueMap.set(userId, max);
  }
  return toRanking(valueMap, users, (v) => `${v.toFixed(1)}% ABV`);
}

/** Ranking by number of distinct beers (unique beer IDs). */
export function getMostDistinctBeersRanking(
  logs: DrinkLog[],
  users: User[],
  range: TimeRange,
): RankingEntry[] {
  const byUser = groupByUser(logs, users, range);
  const valueMap = new Map<string, number>();
  for (const [userId, userLogs] of byUser) {
    const distinct = new Set(userLogs.map((l) => l.beerId)).size;
    valueMap.set(userId, distinct);
  }
  return toRanking(valueMap, users, (v) =>
    v === 1 ? '1 unique' : `${v} unique`,
  );
}

// ---------------------------------------------------------------------------
// Personal stats (single user)
// ---------------------------------------------------------------------------

export interface PersonalStats {
  totalLogged: number;
  totalLitres: number;
  averageAbv: number;
  distinctBeers: number;
  highestAbv: number;
}

export function getPersonalStats(logs: DrinkLog[]): PersonalStats {
  if (logs.length === 0) {
    return { totalLogged: 0, totalLitres: 0, averageAbv: 0, distinctBeers: 0, highestAbv: 0 };
  }
  const totalLitres = logs.reduce((s, l) => s + l.volumeMl, 0) / 1000;
  const averageAbv = logs.reduce((s, l) => s + l.abv, 0) / logs.length;
  const distinctBeers = new Set(logs.map((l) => l.beerId)).size;
  const highestAbv = Math.max(...logs.map((l) => l.abv));
  return {
    totalLogged: logs.length,
    totalLitres,
    averageAbv,
    distinctBeers,
    highestAbv,
  };
}

// ---------------------------------------------------------------------------
// Log store helpers
// ---------------------------------------------------------------------------

import { storage, STORAGE_KEYS } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { Beer } from '../types';

export function getAllLogs(): DrinkLog[] {
  return storage.get<DrinkLog[]>(STORAGE_KEYS.LOGS) ?? [];
}

export function getLogsForUser(userId: string): DrinkLog[] {
  return getAllLogs().filter((l) => l.userId === userId);
}

export function addLog(
  userId: string,
  beer: Beer,
  volumeMl: number,
  consumedAt: Date,
): DrinkLog {
  const log: DrinkLog = {
    id: uuidv4(),
    userId,
    beerId: beer.id,
    beerName: beer.name,
    volumeMl,
    abv: beer.abv,
    consumedAt: consumedAt.toISOString(),
    createdAt: new Date().toISOString(),
  };
  const logs = getAllLogs();
  storage.set(STORAGE_KEYS.LOGS, [...logs, log]);
  return log;
}

export function exportLogsJson(): string {
  return JSON.stringify(getAllLogs(), null, 2);
}

export function importLogsJson(json: string): { imported: number } {
  const incoming = JSON.parse(json) as DrinkLog[];
  const existing = getAllLogs();
  const existingIds = new Set(existing.map((l) => l.id));
  const novel = incoming.filter((l) => !existingIds.has(l.id));
  storage.set(STORAGE_KEYS.LOGS, [...existing, ...novel]);
  return { imported: novel.length };
}

export function clearAllData(): void {
  storage.remove(STORAGE_KEYS.LOGS);
  storage.remove(STORAGE_KEYS.USERS);
  storage.remove(STORAGE_KEYS.SESSION);
}
