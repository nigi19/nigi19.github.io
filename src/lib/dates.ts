/**
 * dates.ts
 *
 * Reusable date-range helpers.
 * Weeks are defined as Monday–Sunday; months are calendar months.
 */

import { TimeRange } from '../types';

/** Start of the day (00:00:00.000) for a given Date. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/** End of the day (23:59:59.999) for a given Date. */
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Given a date, return the Monday of its week.
 * getDay() returns 0=Sun … 6=Sat; we map that to offset from Monday.
 */
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sun
  const offset = day === 0 ? -6 : 1 - day; // distance to previous Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + offset);
  return startOfDay(monday);
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const sunday = new Date(start);
  sunday.setDate(start.getDate() + 6);
  return endOfDay(sunday);
}

export function getThisWeekRange(): TimeRange {
  const now = new Date();
  return { from: startOfWeek(now), to: endOfWeek(now) };
}

export function getLastWeekRange(): TimeRange {
  const now = new Date();
  const lastWeekDate = new Date(now);
  lastWeekDate.setDate(now.getDate() - 7);
  return { from: startOfWeek(lastWeekDate), to: endOfWeek(lastWeekDate) };
}

export function getThisMonthRange(): TimeRange {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

export function getLastMonthRange(): TimeRange {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { from, to };
}

/** Filter an array of items by a date string field within [from, to]. */
export function filterByDateRange<T extends { consumedAt: string }>(
  items: T[],
  range: TimeRange,
): T[] {
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  return items.filter((item) => {
    const t = new Date(item.consumedAt).getTime();
    return t >= fromMs && t <= toMs;
  });
}

/** Format a Date to a readable string, e.g. "8 Mar 2026, 14:32". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
