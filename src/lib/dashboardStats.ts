import { DrinkLog } from '../types';

export interface BeerPopularity {
  name: string;
  count: number;
}

export interface DayActivity {
  date: string;
  drinks: number;
}

/** Top N beers by number of times logged across all users. */
export function getMostPopularBeers(logs: DrinkLog[], limit = 10): BeerPopularity[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    counts.set(log.beerName, (counts.get(log.beerName) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface AbvBucket {
  label: string;
  count: number;
}

const ABV_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: '<4%',   min: 0,   max: 4   },
  { label: '4–5%',  min: 4,   max: 5   },
  { label: '5–6%',  min: 5,   max: 6   },
  { label: '6–8%',  min: 6,   max: 8   },
  { label: '8–10%', min: 8,   max: 10  },
  { label: '10%+',  min: 10,  max: Infinity },
];

/** Count logged beers per ABV bucket. */
export function getAbvDistribution(logs: DrinkLog[]): AbvBucket[] {
  return ABV_BUCKETS.map(({ label, min, max }) => ({
    label,
    count: logs.filter((l) => l.abv >= min && l.abv < max).length,
  }));
}

export interface CumulativePersonData {
  /** One row per day from earliest log to today. Keys: "date" + one userId per person. */
  rows: Array<Record<string, string | number>>;
  users: Array<{ userId: string; displayName: string }>;
}

/**
 * Cumulative beer count per person over time (all-time, day granularity).
 * Returns a recharts-compatible row array with one key per userId.
 */
export function getCumulativePerPerson(
  logs: DrinkLog[],
  displayNames: Map<string, string>,
): CumulativePersonData {
  if (logs.length === 0) return { rows: [], users: [] };

  const userIds = [...new Set(logs.map((l) => l.userId))];

  // Find earliest logged date.
  let earliest = new Date(logs[0].consumedAt);
  for (const log of logs) {
    const d = new Date(log.consumedAt);
    if (d < earliest) earliest = d;
  }

  // Build list of date keys from earliest to today.
  const allKeys: string[] = [];
  const cur = new Date(earliest.getFullYear(), earliest.getMonth(), earliest.getDate());
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  while (cur <= todayStart) {
    allKeys.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`,
    );
    cur.setDate(cur.getDate() + 1);
  }

  // Per-user daily counts.
  const userDateCounts = new Map<string, Map<string, number>>();
  for (const id of userIds) userDateCounts.set(id, new Map());
  for (const log of logs) {
    const d = new Date(log.consumedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const m = userDateCounts.get(log.userId)!;
    m.set(key, (m.get(key) ?? 0) + 1);
  }

  // Build cumulative rows.
  const cumulatives = new Map(userIds.map((id) => [id, 0]));
  const rows = allKeys.map((key) => {
    const row: Record<string, string | number> = {
      date: new Date(key + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    };
    for (const id of userIds) {
      const daily = userDateCounts.get(id)?.get(key) ?? 0;
      const total = (cumulatives.get(id) ?? 0) + daily;
      cumulatives.set(id, total);
      row[id] = total;
    }
    return row;
  });

  return {
    rows,
    users: userIds.map((id) => ({
      userId: id,
      displayName: displayNames.get(id) ?? id,
    })),
  };
}

/** Number of drinks logged per day over the last N days (zero-filled). */
export function getDailyActivity(logs: DrinkLog[], days = 30): DayActivity[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const d = new Date(log.consumedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: DayActivity[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push({
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      drinks: counts.get(key) ?? 0,
    });
  }
  return result;
}
