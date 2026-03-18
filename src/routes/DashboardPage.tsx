import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import { Database } from 'sql.js';
import { getAllLogs } from '../lib/stats';
import { getMostPopularBeers, getDailyActivity, getCumulativePerPerson, getAbvDistribution } from '../lib/dashboardStats';
import { getBeerDb, getStylesForBeerIds } from '../lib/beerDb';
import { getAllDisplayNames } from '../lib/profiles';
import { DrinkLog } from '../types';

const ACCENT = '#d97706';
const GRID   = '#e0d6c3';
const MUTED  = '#78716c';

const PALETTE = [
  '#d97706', '#2563eb', '#16a34a', '#dc2626',
  '#7c3aed', '#db2777', '#0891b2', '#ca8a04',
];

export default function DashboardPage() {
  const [logs, setLogs]         = useState<DrinkLog[]>([]);
  const [beerDb, setBeerDb]     = useState<Database | null>(null);
  const [displayNames, setDisplayNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading]   = useState(true);

  // Popular beers filter
  const [selectedStyle, setSelectedStyle] = useState('');

  // Cumulative chart: set of visible userIds (all visible by default)
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([getAllLogs(), getBeerDb(), getAllDisplayNames()])
      .then(([fetchedLogs, db, names]) => {
        setLogs(fetchedLogs);
        setBeerDb(db);
        setDisplayNames(names);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Style map & filter (popular beers chart) ────────────────────────────
  const styleMap = useMemo(() => {
    if (!beerDb || logs.length === 0) return new Map<string, string>();
    const ids = [...new Set(logs.map((l) => l.beerId))];
    return getStylesForBeerIds(beerDb, ids);
  }, [beerDb, logs]);

  const availableStyles = useMemo(() => {
    const styles = new Set<string>();
    for (const style of styleMap.values()) if (style) styles.add(style);
    return [...styles].sort();
  }, [styleMap]);

  const filteredLogs = useMemo(() =>
    selectedStyle ? logs.filter((l) => styleMap.get(l.beerId) === selectedStyle) : logs,
  [logs, selectedStyle, styleMap]);

  // ── Cumulative per-person data ──────────────────────────────────────────
  const { rows: cumulRows, users: cumulUsers } = useMemo(
    () => getCumulativePerPerson(logs, displayNames),
    [logs, displayNames],
  );

  // X-axis interval: show ~8 labels regardless of range length
  const xInterval = cumulRows.length > 0
    ? Math.max(1, Math.floor(cumulRows.length / 8))
    : 1;

  function toggleUser(userId: string) {
    setHiddenUsers((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  const popularBeers   = getMostPopularBeers(filteredLogs, 10);
  const dailyActivity  = getDailyActivity(logs, 30);
  const abvDistribution = getAbvDistribution(logs);

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">A group-wide view of all logged beers.</p>

      <div className="dashboard-grid">

        {/* ── Most popular beers ── */}
        <div className="chart-card chart-card--tall">
          <div className="chart-card__header">
            <div className="chart-card__title">Most popular beers</div>
            {availableStyles.length > 0 && (
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              >
                <option value="">All styles</option>
                {availableStyles.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
          {popularBeers.length === 0 ? (
            <p className="chart-empty">No data{selectedStyle ? ` for ${selectedStyle}` : ''} yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={popularBeers}
                margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: MUTED }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 12, fill: MUTED }}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 17) + '…' : v}
                />
                <Tooltip
                  formatter={(v) => [Number(v) === 1 ? '1 time' : `${v} times`, 'Logged']}
                  contentStyle={{ fontSize: 13, borderColor: GRID }}
                />
                <Bar dataKey="count" fill={ACCENT} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── ABV distribution ── */}
        <div className="chart-card chart-card--tall">
          <div className="chart-card__header">
            <div className="chart-card__title">ABV distribution</div>
          </div>
          {logs.length === 0 ? (
            <p className="chart-empty">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={abvDistribution}
                margin={{ top: 0, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: MUTED }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: MUTED }} />
                <Tooltip
                  formatter={(v) => [Number(v) === 1 ? '1 beer' : `${v} beers`, 'Logged']}
                  contentStyle={{ fontSize: 13, borderColor: GRID }}
                />
                <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Beers per day (last 30 days) ── */}
        <div className="chart-card chart-card--tall chart-card--wide">
          <div className="chart-card__header">
            <div className="chart-card__title">Beers per day – last 30 days</div>
          </div>
          {logs.length === 0 ? (
            <p className="chart-empty">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={dailyActivity}
                margin={{ top: 0, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: MUTED }}
                  interval={4}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: MUTED }} />
                <Tooltip
                  formatter={(v) => [Number(v) === 1 ? '1 beer' : `${v} beers`, 'Logged']}
                  contentStyle={{ fontSize: 13, borderColor: GRID }}
                />
                <Line
                  type="monotone"
                  dataKey="drinks"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: ACCENT }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ── Cumulative beers per person ── */}
      {cumulUsers.length > 0 && (
        <div className="chart-card" style={{ marginTop: 24 }}>
          <div className="chart-card__header">
            <div className="chart-card__title">Cumulative beers per person – all time</div>
            <div className="cumul-toggles">
              {cumulUsers.map((u, i) => {
                const color = PALETTE[i % PALETTE.length];
                const active = !hiddenUsers.has(u.userId);
                return (
                  <button
                    key={u.userId}
                    className={'cumul-toggle' + (active ? ' cumul-toggle--active' : '')}
                    style={active ? { borderColor: color, background: color, color: '#fff' } : { borderColor: color, color }}
                    onClick={() => toggleUser(u.userId)}
                  >
                    {u.displayName}
                  </button>
                );
              })}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={cumulRows}
              margin={{ top: 4, right: 16, bottom: 0, left: -8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: MUTED }}
                interval={xInterval}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: MUTED }} />
              <Tooltip
                contentStyle={{ fontSize: 13, borderColor: GRID }}
                formatter={(v, name) => {
                  const user = cumulUsers.find((u) => u.userId === name);
                  return [v, user?.displayName ?? name];
                }}
              />
              {cumulUsers.map((u, i) =>
                hiddenUsers.has(u.userId) ? null : (
                  <Line
                    key={u.userId}
                    type="monotone"
                    dataKey={u.userId}
                    name={u.userId}
                    stroke={PALETTE[i % PALETTE.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                ),
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Ideas section ── */}
      <div className="section-title" style={{ marginTop: 32 }}>Coming soon — ideas</div>
      <div className="dashboard-ideas">
        {[
          {
            title: 'Beers by style',
            desc: 'Donut chart of logged beers grouped by style (IPA, Stout, Lager, …).',
          },
          {
            title: 'Most active hour',
            desc: 'Bar chart by hour of day — find out when the group drinks most.',
          },
        ].map((idea) => (
          <div key={idea.title} className="idea-card">
            <div className="idea-card__title">{idea.title}</div>
            <div className="idea-card__desc">{idea.desc}</div>
          </div>
        ))}
      </div>
    </>
  );
}
