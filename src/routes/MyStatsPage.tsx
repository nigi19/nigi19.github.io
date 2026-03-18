import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLogsForUser, getPersonalStats } from '../lib/stats';
import { getAllProfiles } from '../lib/profiles';
import { DrinkLog } from '../types';
import { formatDateTime } from '../lib/dates';

export default function StatsPage() {
  const { session, displayName } = useAuth();

  const [users, setUsers] = useState<{ id: string; displayName: string }[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all profiles for the dropdown.
  useEffect(() => {
    if (!session) return;
    getAllProfiles().then((profiles) => {
      // Ensure current user is always in the list.
      const hasCurrentUser = profiles.some((p) => p.id === session.userId);
      const list = hasCurrentUser
        ? profiles
        : [{ id: session.userId, displayName }, ...profiles];
      setUsers(list);
      setSelectedId(session.userId);
    });
  }, [session]);

  // Load logs whenever selected user changes.
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    getLogsForUser(selectedId)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [selectedId]);

  if (!session) return null;

  const selectedName = users.find((u) => u.id === selectedId)?.displayName ?? displayName;
  const isOwnProfile = selectedId === session.userId;
  const stats = getPersonalStats(logs);
  const recent = logs.slice(0, 10);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Stats</h1>
        {users.length > 1 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}{u.id === session.userId ? ' (you)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="page-subtitle">
        {isOwnProfile ? `Everything you've logged, ${selectedName}.` : `Stats for ${selectedName}.`}
      </p>

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
              {isOwnProfile
                ? <>No beers logged yet. Head to the <a href="#/beers">Beer Catalog</a> to log your first one!</>
                : `${selectedName} hasn't logged any beers yet.`}
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
