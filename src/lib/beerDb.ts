/**
 * beerDb.ts
 *
 * Loads beers.sqlite into the browser using sql.js (SQLite compiled to WASM).
 *
 * The entire database is fetched once and held in memory. For ~6 000 beers
 * this is typically < 4 MB — well within browser limits. sql.js-httpvfs
 * would be better for larger datasets but adds significant complexity.
 *
 * Usage:
 *   const db = await getBeerDb();
 *   const results = await searchBeers(db, { query: 'trippel' });
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { Beer } from '../types';
import { storage, STORAGE_KEYS } from './storage';

// Singleton — we only load the WASM and the DB once.
let sqlJs: SqlJsStatic | null = null;
let db: Database | null = null;

/**
 * Initialise sql.js and load beers.sqlite.
 * Subsequent calls return the cached instance immediately.
 */
export async function getBeerDb(): Promise<Database> {
  if (db) return db;

  // sql.js WASM file is copied to dist/ root by vite-plugin-static-copy.
  // import.meta.env.BASE_URL resolves to './' in production so paths work
  // under any GitHub Pages sub-path.
  sqlJs = await initSqlJs({
    locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
  });

  const response = await fetch(`${import.meta.env.BASE_URL}beers.sqlite`);
  if (!response.ok) {
    throw new Error(`Failed to fetch beers.sqlite: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  db = new sqlJs.Database(new Uint8Array(buffer));

  // Re-insert any user-added beers from localStorage into the in-memory DB.
  const customBeers = storage.get<Beer[]>(STORAGE_KEYS.CUSTOM_BEERS) ?? [];
  if (customBeers.length > 0) {
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO beers (id, name, brewery, style, abv, country) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const beer of customBeers) {
      stmt.run([beer.id, beer.name, beer.brewery, beer.style, beer.abv, beer.country]);
    }
    stmt.free();
  }

  return db;
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export interface BeerSearchParams {
  query?: string;       // substring match on name + brewery
  style?: string;       // exact style filter
  minAbv?: number;
  maxAbv?: number;
  limit?: number;
  offset?: number;
}

/** Run a parameterised search against the beers table. */
export function searchBeers(
  database: Database,
  params: BeerSearchParams,
): { rows: Beer[]; total: number } {
  const {
    query = '',
    style = '',
    minAbv,
    maxAbv,
    limit = 20,
    offset = 0,
  } = params;

  // Build WHERE clauses dynamically.
  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  if (query.trim()) {
    conditions.push(
      "(lower(name) LIKE lower('%' || ? || '%') OR lower(brewery) LIKE lower('%' || ? || '%'))",
    );
    bindings.push(query.trim(), query.trim());
  }
  if (style) {
    conditions.push('style = ?');
    bindings.push(style);
  }
  if (minAbv !== undefined) {
    conditions.push('abv >= ?');
    bindings.push(minAbv);
  }
  if (maxAbv !== undefined) {
    conditions.push('abv <= ?');
    bindings.push(maxAbv);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total matches for pagination.
  const countSql = `SELECT COUNT(*) as cnt FROM beers ${where}`;
  const countResult = database.exec(countSql, bindings);
  const total = countResult.length > 0
    ? (countResult[0].values[0][0] as number)
    : 0;

  // Fetch the page.
  const dataSql = `
    SELECT id, name, brewery, style, abv, country
    FROM beers
    ${where}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `;
  const dataResult = database.exec(dataSql, [...bindings, limit, offset]);

  const rows: Beer[] = [];
  if (dataResult.length > 0) {
    for (const row of dataResult[0].values) {
      rows.push({
        id: String(row[0]),
        name: String(row[1]),
        brewery: String(row[2]),
        style: String(row[3]),
        abv: Number(row[4]),
        country: String(row[5]),
      });
    }
  }

  return { rows, total };
}

/** Return all distinct styles for the filter dropdown. */
export function getDistinctStyles(database: Database): string[] {
  const result = database.exec(
    "SELECT DISTINCT style FROM beers WHERE style IS NOT NULL AND style != '' ORDER BY style ASC",
  );
  if (result.length === 0) return [];
  return result[0].values.map((r) => String(r[0]));
}

/** Return all distinct countries for the filter dropdown. */
export function getDistinctCountries(database: Database): string[] {
  const result = database.exec(
    "SELECT DISTINCT country FROM beers WHERE country IS NOT NULL AND country != '' ORDER BY country ASC",
  );
  if (result.length === 0) return [];
  return result[0].values.map((r) => String(r[0]));
}

/** Add a user-created beer to both the in-memory DB and localStorage. */
export function addCustomBeer(database: Database, fields: Omit<Beer, 'id'>): Beer {
  const beer: Beer = { id: `custom_${crypto.randomUUID()}`, ...fields };
  database.run(
    'INSERT INTO beers (id, name, brewery, style, abv, country) VALUES (?, ?, ?, ?, ?, ?)',
    [beer.id, beer.name, beer.brewery, beer.style, beer.abv, beer.country],
  );
  const existing = storage.get<Beer[]>(STORAGE_KEYS.CUSTOM_BEERS) ?? [];
  storage.set(STORAGE_KEYS.CUSTOM_BEERS, [...existing, beer]);
  return beer;
}

/** Look up a single beer by its ID (for display purposes). */
export function getBeerById(database: Database, id: string): Beer | null {
  const result = database.exec(
    'SELECT id, name, brewery, style, abv, country FROM beers WHERE id = ?',
    [id],
  );
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: String(row[0]),
    name: String(row[1]),
    brewery: String(row[2]),
    style: String(row[3]),
    abv: Number(row[4]),
    country: String(row[5]),
  };
}
