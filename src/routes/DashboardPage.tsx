import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import { getAllLogs } from '../lib/stats';
import { getMostPopularBeers, getDailyActivity } from '../lib/dashboardStats';
import { DrinkLog } from '../types';

const ACCENT = '#d97706';
const GRID   = '#e0d6c3';
const MUTED  = '#78716c';

export default function DashboardPage() {
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  const popularBeers  = getMostPopularBeers(logs, 10);
  const dailyActivity = getDailyActivity(logs, 30);

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
          <div className="chart-card__title">Most popular beers</div>
          {popularBeers.length === 0 ? (
            <p className="chart-empty">No data yet.</p>
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

        {/* ── Beers per day (last 30 days) ── */}
        <div className="chart-card chart-card--tall">
          <div className="chart-card__title">Beers per day – last 30 days</div>
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

      {/* ── Ideas section ── */}
      <div className="section-title" style={{ marginTop: 32 }}>Coming soon — ideas</div>
      <div className="dashboard-ideas">
        {[
          {
            title: 'ABV distribution',
            desc: 'Bucketed histogram (2–4%, 4–6%, 6–8%, …) showing which ABV range you collectively prefer.',
          },
          {
            title: 'Beers by style',
            desc: 'Donut chart of logged beers grouped by style (IPA, Stout, Lager, …).',
          },
          {
            title: 'Most active hour',
            desc: 'Bar chart by hour of day — find out when the group drinks most.',
          },
          {
            title: 'Per-person totals over time',
            desc: 'Multi-line chart with a line per user showing their cumulative beer count.',
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
