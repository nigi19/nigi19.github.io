// ---------------------------------------------------------------------------
// Core data models
// ---------------------------------------------------------------------------

export interface Session {
  userId: string;
  email: string;
}

/**
 * A single logged drink entry.
 * Stored in Supabase drink_logs table.
 */
export interface DrinkLog {
  id: string;
  userId: string;
  userEmail: string;    // denormalised for leaderboard display
  beerId: string;       // matches beers.id in SQLite
  beerName: string;     // denormalised for display without a DB round-trip
  volumeMl: number;
  abv: number;          // denormalised from beer at log time
  consumedAt: string;   // ISO date/time chosen by user
  createdAt: string;    // ISO timestamp when the log was created
}

/** Minimal beer record returned from the SQLite search. */
export interface Beer {
  id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  country: string;
}

/** A date range used for filtering leaderboards. */
export interface TimeRange {
  from: Date;
  to: Date;
}

/** Preset keys for the time range selector. */
export type TimeRangePreset =
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'custom';

/** One row in a rankings leaderboard. */
export interface RankingEntry {
  userId: string;
  email: string;
  value: number;
  formattedValue: string;
}
