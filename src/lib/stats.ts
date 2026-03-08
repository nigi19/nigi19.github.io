/**
 * stats.ts
 *
 * Pure functions for computing leaderboard rankings and personal stats
 * from a list of DrinkLog entries, plus async helpers for reading/writing
 * logs via Supabase.
 */

import { DrinkLog, RankingEntry, TimeRange } from '../types';
import { filterByDateRange } from './dates';
import { supabase } from './supabase';
import { Beer } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByUser(
  logs: DrinkLog[],
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

function buildEmailMap(logs: DrinkLog[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const log of logs) {
    if (!map.has(log.userId)) map.set(log.userId, log.userEmail);
  }
  return map;
}

function toRanking(
  valueMap: Map<string, number>,
  emailMap: Map<string, string>,
  format: (v: number) => string,
): RankingEntry[] {
  return Array.from(valueMap.entries())
    .map(([userId, value]) => ({
      userId,
      email: emailMap.get(userId) ?? userId,
      value,
      formattedValue: format(value),
    }))
    .sort((a, b) => b.value - a.value || a.email.localeCompare(b.email));
}

// ---------------------------------------------------------------------------
// Leaderboard functions (pure, synchronous)
// ---------------------------------------------------------------------------

export function getMostVolumeRanking(logs: DrinkLog[], range: TimeRange): RankingEntry[] {
  const byUser = groupByUser(logs, range);
  const emailMap = buildEmailMap(logs);
  const valueMap = new Map<string, number>();
  for (const [userId, userLogs] of byUser) {
    valueMap.set(userId, userLogs.reduce((sum, l) => sum + l.volumeMl, 0));
  }
  return toRanking(valueMap, emailMap, (v) => `${(v / 1000).toFixed(1)} L`);
}

export function getMostBeersRanking(logs: DrinkLog[], range: TimeRange): RankingEntry[] {
  const byUser = groupByUser(logs, range);
  const emailMap = buildEmailMap(logs);
  const valueMap = new Map<string, number>();
  for (const [userId, userLogs] of byUser) {
    valueMap.set(userId, userLogs.length);
  }
  return toRanking(valueMap, emailMap, (v) => v === 1 ? '1 beer' : `${v} beers`);
}

export function getHighestAbvRanking(logs: DrinkLog[], range: TimeRange): RankingEntry[] {
  const byUser = groupByUser(logs, range);
  const emailMap = buildEmailMap(logs);
  const valueMap = new Map<string, number>();
  for (const [userId, userLogs] of byUser) {
    valueMap.set(userId, Math.max(...userLogs.map((l) => l.abv)));
  }
  return toRanking(valueMap, emailMap, (v) => `${v.toFixed(1)}% ABV`);
}

export function getMostDistinctBeersRanking(logs: DrinkLog[], range: TimeRange): RankingEntry[] {
  const byUser = groupByUser(logs, range);
  const emailMap = buildEmailMap(logs);
  const valueMap = new Map<string, number>();
  for (const [userId, userLogs] of byUser) {
    valueMap.set(userId, new Set(userLogs.map((l) => l.beerId)).size);
  }
  return toRanking(valueMap, emailMap, (v) => v === 1 ? '1 unique' : `${v} unique`);
}

// ---------------------------------------------------------------------------
// Personal stats (pure, synchronous)
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
  return {
    totalLogged: logs.length,
    totalLitres: logs.reduce((s, l) => s + l.volumeMl, 0) / 1000,
    averageAbv: logs.reduce((s, l) => s + l.abv, 0) / logs.length,
    distinctBeers: new Set(logs.map((l) => l.beerId)).size,
    highestAbv: Math.max(...logs.map((l) => l.abv)),
  };
}

// ---------------------------------------------------------------------------
// Supabase log helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLog(row: any): DrinkLog {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    userEmail: String(row.user_email),
    beerId: String(row.beer_id),
    beerName: String(row.beer_name),
    volumeMl: Number(row.volume_ml),
    abv: Number(row.abv),
    consumedAt: String(row.consumed_at),
    createdAt: String(row.created_at),
  };
}

export async function getAllLogs(): Promise<DrinkLog[]> {
  const { data, error } = await supabase
    .from('drink_logs')
    .select('*')
    .order('consumed_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToLog);
}

export async function getLogsForUser(userId: string): Promise<DrinkLog[]> {
  const { data, error } = await supabase
    .from('drink_logs')
    .select('*')
    .eq('user_id', userId)
    .order('consumed_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToLog);
}

export async function addLog(
  userId: string,
  userEmail: string,
  beer: Beer,
  volumeMl: number,
  consumedAt: Date,
): Promise<DrinkLog> {
  const { data, error } = await supabase
    .from('drink_logs')
    .insert({
      user_id: userId,
      user_email: userEmail,
      beer_id: beer.id,
      beer_name: beer.name,
      volume_ml: volumeMl,
      abv: beer.abv,
      consumed_at: consumedAt.toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToLog(data);
}
