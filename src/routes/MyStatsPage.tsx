import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLogsForUser, getPersonalStats } from '../lib/stats';
import { DrinkLog } from '../types';
import { formatDateTime } from '../lib/dates';

export default function MyStatsPage() {
  const { session } = useAuth();
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    getLogsForUser(session.userId)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return null;

  const stats = getPersonalStats(logs);
  const recent = logs.slice(0, 10); // already sorted by consumed_at desc from Supabase

  return (
    <>
      <h1 className="page-title">My Stats</h1>
      <p className="page-subtitle">Everything you've logged, {session.email.split('@')[0]}.</p>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="card stat-card">
              <div className="stat-card__value">{stats.totalLogged}</div>
              <div className="stat-card__label">Beers logged</div>
            </div>
            <div className="card stat-card">
              <div className="stat-card__value">{stats.totalLitres.toFixed(1)}</div>
              <div className="stat-card__label">Litres consumed</div>
            </div>
            <div className="card stat-card">
              <div className="stat-card__value">{stats.averageAbv.toFixed(1)}%</div>
              <div className="stat-card__label">Avg ABV</div>
            </div>
            <div className="card stat-card">
              <div className="stat-card__value">{stats.distinctBeers}</div>
              <div className="stat-card__label">Unique beers</div>
            </div>
            <div className="card stat-card">
              <div className="stat-card__value">{stats.highestAbv.toFixed(1)}%</div>
              <div className="stat-card__label">Highest ABV</div>
            </div>
          </div>

          <div className="section-title">Recent activity</div>

          {recent.length === 0 ? (
            <div className="card" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              No beers logged yet. Head to the{' '}
              <a href="#/beers">Beer Catalog</a> to log your first one!
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Beer</th>
                    <th>Volume</th>
                    <th>ABV</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((log) => (
                    <tr key={log.id}>
                      <td>{log.beerName}</td>
                      <td>{log.volumeMl} ml</td>
                      <td>{log.abv.toFixed(1)}%</td>
                      <td>{formatDateTime(log.consumedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
