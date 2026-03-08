#!/usr/bin/env node
/**
 * build-db.js
 *
 * Downloads (or reads locally) an open beer dataset in JSON format and
 * writes a SQLite database to public/beers.sqlite.
 *
 * Run once before building:
 *   node scripts/build-db.js
 *
 * Data source: Open Beer Database — https://openbeer.github.io
 * Raw JSON:    https://raw.githubusercontent.com/nicholasgasior/gsr-beer/master/db.json
 *
 * The script falls back to a small bundled sample set if the download fails
 * (useful for offline/CI environments).
 *
 * Uses sql.js (SQLite compiled to WASM) — no native compilation needed.
 */

import { createRequire } from 'module';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// sql.js is a CommonJS module; use createRequire to import it in ESM.
const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'public', 'beers.sqlite');

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'beer-tracker-build' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(httpsGet(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Beer data sources
// ---------------------------------------------------------------------------

async function fetchBeers() {
  // Open Beer Database CSV (hosted by samfrancesco on GitHub)
  // ~6 000 rows, tab-separated: id,name,style,abv,ibu,brewery_id,brewery_name,country
  const CSV_URL =
    'https://raw.githubusercontent.com/nicholasgasior/gsr-beer/master/beers.json';

  // Alternative: the openbeerdb JSON dataset
  const ALT_URL =
    'https://raw.githubusercontent.com/openbrewerydb/openbrewerydb/master/breweries.json';

  // We try a simple curated list from a reliable public source.
  // If all fail, the 50-beer fallback kicks in.
  const SOURCES = [
    {
      url: 'https://raw.githubusercontent.com/benschw/oab-api/master/beers.json',
      parse: (raw) => {
        // [{id, name, brewery_name, category_name, style_name, abv, ...}]
        const arr = JSON.parse(raw);
        return arr.map((b, i) => ({
          id: String(b.id ?? i + 1),
          name: String(b.name ?? '').trim(),
          brewery: String(b.brewery_name ?? '').trim(),
          style: String(b.style_name ?? b.category_name ?? '').trim(),
          abv: parseFloat(b.abv) || 0,
          country: '',
        })).filter((b) => b.name);
      },
    },
  ];

  for (const source of SOURCES) {
    try {
      console.log(`Fetching from: ${source.url}`);
      const raw = await httpsGet(source.url);
      const beers = source.parse(raw);
      if (beers.length > 0) {
        console.log(`Fetched ${beers.length} beers.`);
        return beers;
      }
    } catch (err) {
      console.warn(`Source failed: ${err.message}`);
    }
  }

  console.log('All remote sources failed. Using built-in sample dataset (50 beers).');
  return SAMPLE_BEERS;
}

// ---------------------------------------------------------------------------
// Tiny fallback sample
// ---------------------------------------------------------------------------

const SAMPLE_BEERS = [
  { id: '1',  name: 'Duvel',                  brewery: 'Duvel Moortgat',        style: 'Belgian Strong Ale',    abv: 8.5,  country: 'Belgium' },
  { id: '2',  name: 'Westmalle Tripel',        brewery: 'Westmalle',             style: 'Tripel',                abv: 9.5,  country: 'Belgium' },
  { id: '3',  name: 'Chimay Bleue',            brewery: 'Chimay',                style: 'Belgian Strong Dark',   abv: 9.0,  country: 'Belgium' },
  { id: '4',  name: 'Orval',                   brewery: "Abbaye d'Orval",        style: 'Belgian Pale Ale',      abv: 6.2,  country: 'Belgium' },
  { id: '5',  name: 'Rochefort 10',            brewery: 'Rochefort',             style: 'Quadrupel',             abv: 11.3, country: 'Belgium' },
  { id: '6',  name: 'Weihenstephaner Hefeweizen', brewery: 'Weihenstephan',      style: 'Hefeweizen',            abv: 5.4,  country: 'Germany' },
  { id: '7',  name: 'Paulaner Salvator',       brewery: 'Paulaner',              style: 'Doppelbock',            abv: 7.9,  country: 'Germany' },
  { id: '8',  name: 'Erdinger Weißbier',       brewery: 'Erdinger',              style: 'Hefeweizen',            abv: 5.3,  country: 'Germany' },
  { id: '9',  name: 'Ayinger Celebrator',      brewery: 'Ayinger',               style: 'Doppelbock',            abv: 6.7,  country: 'Germany' },
  { id: '10', name: 'König Ludwig Weissbier',  brewery: 'König Ludwig',          style: 'Hefeweizen',            abv: 5.5,  country: 'Germany' },
  { id: '11', name: 'Guinness Draught',        brewery: 'Guinness',              style: 'Irish Stout',           abv: 4.2,  country: 'Ireland' },
  { id: '12', name: "Murphy's Irish Stout",    brewery: "Murphy's",              style: 'Irish Stout',           abv: 4.0,  country: 'Ireland' },
  { id: '13', name: 'Stella Artois',           brewery: 'AB InBev',              style: 'Lager',                 abv: 5.2,  country: 'Belgium' },
  { id: '14', name: 'Heineken',                brewery: 'Heineken',              style: 'Lager',                 abv: 5.0,  country: 'Netherlands' },
  { id: '15', name: 'Grolsch Premium Lager',   brewery: 'Grolsch',               style: 'Lager',                 abv: 5.0,  country: 'Netherlands' },
  { id: '16', name: 'La Chouffe',              brewery: "Brasserie d'Achouffe",  style: 'Belgian Strong Ale',    abv: 8.0,  country: 'Belgium' },
  { id: '17', name: 'Leffe Blonde',            brewery: 'AB InBev',              style: 'Abbey Ale',             abv: 6.6,  country: 'Belgium' },
  { id: '18', name: 'Hoegaarden',              brewery: 'AB InBev',              style: 'Witbier',               abv: 4.9,  country: 'Belgium' },
  { id: '19', name: 'Kwak',                    brewery: 'Bosteels',              style: 'Belgian Pale Ale',      abv: 8.4,  country: 'Belgium' },
  { id: '20', name: 'Jupiler',                 brewery: 'AB InBev',              style: 'Lager',                 abv: 5.2,  country: 'Belgium' },
  { id: '21', name: 'Sierra Nevada Pale Ale',  brewery: 'Sierra Nevada',         style: 'American Pale Ale',     abv: 5.6,  country: 'USA' },
  { id: '22', name: 'Anchor Steam Beer',       brewery: 'Anchor Brewing',        style: 'California Common',     abv: 4.9,  country: 'USA' },
  { id: '23', name: 'Samuel Adams Boston Lager', brewery: 'Boston Beer Co',      style: 'Vienna Lager',          abv: 4.9,  country: 'USA' },
  { id: '24', name: 'Brooklyn Lager',          brewery: 'Brooklyn Brewery',      style: 'Amber Lager',           abv: 5.2,  country: 'USA' },
  { id: '25', name: 'Dogfish Head 60 Min IPA', brewery: 'Dogfish Head',          style: 'IPA',                   abv: 6.0,  country: 'USA' },
  { id: '26', name: 'Pliny the Elder',         brewery: 'Russian River',         style: 'Double IPA',            abv: 8.0,  country: 'USA' },
  { id: '27', name: 'Stone IPA',               brewery: 'Stone Brewing',         style: 'IPA',                   abv: 6.9,  country: 'USA' },
  { id: '28', name: 'Lagunitas IPA',           brewery: 'Lagunitas',             style: 'IPA',                   abv: 6.2,  country: 'USA' },
  { id: '29', name: 'Modelo Especial',         brewery: 'Grupo Modelo',          style: 'Lager',                 abv: 4.4,  country: 'Mexico' },
  { id: '30', name: 'Corona Extra',            brewery: 'Grupo Modelo',          style: 'Lager',                 abv: 4.6,  country: 'Mexico' },
  { id: '31', name: 'Sapporo Premium Beer',    brewery: 'Sapporo',               style: 'Lager',                 abv: 4.9,  country: 'Japan' },
  { id: '32', name: 'Asahi Super Dry',         brewery: 'Asahi',                 style: 'Lager',                 abv: 5.0,  country: 'Japan' },
  { id: '33', name: 'Kirin Ichiban',           brewery: 'Kirin',                 style: 'Lager',                 abv: 5.0,  country: 'Japan' },
  { id: '34', name: 'Singha',                  brewery: 'Boon Rawd',             style: 'Lager',                 abv: 5.0,  country: 'Thailand' },
  { id: '35', name: 'Chang Classic',           brewery: 'ThaiBev',               style: 'Lager',                 abv: 5.0,  country: 'Thailand' },
  { id: '36', name: 'Kronenbourg 1664',        brewery: 'Kronenbourg',           style: 'Lager',                 abv: 5.0,  country: 'France' },
  { id: '37', name: 'Grimbergen Blonde',       brewery: 'Alken-Maes',            style: 'Abbey Ale',             abv: 6.7,  country: 'Belgium' },
  { id: '38', name: 'Palm Amber',              brewery: 'Palm',                  style: 'Belgian Amber',         abv: 5.4,  country: 'Belgium' },
  { id: '39', name: 'Delirium Tremens',        brewery: 'Huyghe',                style: 'Belgian Strong Pale',   abv: 8.5,  country: 'Belgium' },
  { id: '40', name: 'St. Bernardus Abt 12',   brewery: 'St. Bernardus',         style: 'Quadrupel',             abv: 10.0, country: 'Belgium' },
  { id: '41', name: 'Vedett Extra Blonde',     brewery: 'Duvel Moortgat',        style: 'Pilsner',               abv: 5.2,  country: 'Belgium' },
  { id: '42', name: 'Tripel Karmeliet',        brewery: 'Bosteels',              style: 'Tripel',                abv: 8.4,  country: 'Belgium' },
  { id: '43', name: 'Gouden Carolus Classic',  brewery: 'Het Anker',             style: 'Belgian Dark Strong',   abv: 8.5,  country: 'Belgium' },
  { id: '44', name: 'Maredsous 8° Brune',      brewery: 'Duvel Moortgat',        style: 'Dubbel',                abv: 8.0,  country: 'Belgium' },
  { id: '45', name: 'Affligem Blond',          brewery: 'Affligem',              style: 'Abbey Ale',             abv: 6.7,  country: 'Belgium' },
  { id: '46', name: 'Kasteel Tripel',          brewery: 'Van Honsebrouck',       style: 'Tripel',                abv: 11.0, country: 'Belgium' },
  { id: '47', name: 'Bush Prestige',           brewery: 'Dubuisson',             style: 'Belgian Strong Ale',    abv: 13.0, country: 'Belgium' },
  { id: '48', name: 'Gulden Draak',            brewery: 'Van Steenberge',        style: 'Belgian Quadrupel',     abv: 10.5, country: 'Belgium' },
  { id: '49', name: 'Barbar Blonde',           brewery: 'Lefebvre',              style: 'Belgian Honey Ale',     abv: 8.0,  country: 'Belgium' },
  { id: '50', name: 'Augustijn Blonde',        brewery: 'Van Steenberge',        style: 'Belgian Blonde',        abv: 8.0,  country: 'Belgium' },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Dynamically import sql.js (it's ESM-compatible as a CommonJS module).
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  const beers = await fetchBeers();

  // Ensure public/ directory exists.
  const publicDir = join(ROOT, 'public');
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

  // Create a new in-memory SQLite database.
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE beers (
      id      TEXT PRIMARY KEY,
      name    TEXT NOT NULL,
      brewery TEXT NOT NULL DEFAULT '',
      style   TEXT NOT NULL DEFAULT '',
      abv     REAL NOT NULL DEFAULT 0,
      country TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX idx_beers_name    ON beers(name);
    CREATE INDEX idx_beers_brewery ON beers(brewery);
    CREATE INDEX idx_beers_style   ON beers(style);
  `);

  // Bulk insert using a prepared statement inside a transaction.
  db.run('BEGIN TRANSACTION');
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO beers (id, name, brewery, style, abv, country) VALUES (?, ?, ?, ?, ?, ?)',
  );
  for (const b of beers) {
    stmt.run([b.id, b.name, b.brewery, b.style, b.abv, b.country]);
  }
  stmt.free();
  db.run('COMMIT');

  // Export to a Uint8Array and write to disk.
  const data = db.export();
  db.close();

  writeFileSync(OUT, Buffer.from(data));

  console.log(`\nDone! Written to: ${OUT}`);
  console.log(`Total beers: ${beers.length}`);
  console.log(`File size: ${(data.byteLength / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
