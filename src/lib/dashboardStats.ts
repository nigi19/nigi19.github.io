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
