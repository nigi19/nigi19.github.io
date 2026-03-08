import { useState, useEffect, useCallback } from 'react';
import { Database } from 'sql.js';
import { getBeerDb, searchBeers, getDistinctStyles } from '../lib/beerDb';
import { Beer } from '../types';
import BeerSearchForm from '../components/BeerSearchForm';
import BeerResultsList from '../components/BeerResultsList';
import LogBeerModal from '../components/LogBeerModal';
import AddBeerModal from '../components/AddBeerModal';

const PAGE_SIZE = 20;

export interface SearchParams {
  query: string;
  style: string;
  minAbv: string;
  maxAbv: string;
}

export default function BeersPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [dbError, setDbError] = useState('');
  const [styles, setStyles] = useState<string[]>([]);

  const [params, setParams] = useState<SearchParams>({ query: '', style: '', minAbv: '', maxAbv: '' });
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<Beer[]>([]);
  const [total, setTotal] = useState(0);

  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const [showAddBeer, setShowAddBeer] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Load SQLite DB on mount.
  useEffect(() => {
    getBeerDb()
      .then((database) => {
        setDb(database);
        setStyles(getDistinctStyles(database));
      })
      .catch((err: Error) => setDbError(err.message));
  }, []);

  // Run search whenever DB, params, or page changes.
  const runSearch = useCallback(() => {
    if (!db) return;
    const { rows, total: t } = searchBeers(db, {
      query: params.query,
      style: params.style,
      minAbv: params.minAbv ? Number(params.minAbv) : undefined,
      maxAbv: params.maxAbv ? Number(params.maxAbv) : undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
    setResults(rows);
    setTotal(t);
  }, [db, params, page]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  // Reset to page 0 when search params change.
  function handleParamsChange(next: SearchParams) {
    setParams(next);
    setPage(0);
  }

  function handleLogged() {
    setSuccessMsg(`Logged "${selectedBeer?.name}"!`);
    setSelectedBeer(null);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function handleBeerAdded(beer: Beer) {
    setShowAddBeer(false);
    setSuccessMsg(`Added "${beer.name}" to the catalog!`);
    setTimeout(() => setSuccessMsg(''), 3000);
    setStyles(getDistinctStyles(db!));
    runSearch();
  }

  if (dbError) {
    return (
      <div className="alert alert-error" style={{ marginTop: 24 }}>
        Could not load beer database: {dbError}.<br />
        Make sure you have run <code>npm run build-db</code> and the file{' '}
        <code>public/beers.sqlite</code> exists.
      </div>
    );
  }

  if (!db) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading beer database…
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 className="page-title">Beer Catalog</h1>
          <p className="page-subtitle">Search {total.toLocaleString()} beers and log what you drink.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddBeer(true)}>
          + Add beer
        </button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <BeerSearchForm
        params={params}
        styles={styles}
        onChange={handleParamsChange}
      />

      <BeerResultsList
        beers={results}
        onLog={setSelectedBeer}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {selectedBeer && (
        <LogBeerModal
          beer={selectedBeer}
          onClose={() => setSelectedBeer(null)}
          onLogged={handleLogged}
        />
      )}

      {showAddBeer && (
        <AddBeerModal
          db={db}
          onClose={() => setShowAddBeer(false)}
          onAdded={handleBeerAdded}
        />
      )}
    </>
  );
}
