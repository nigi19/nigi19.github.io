import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllLogs, getMostVolumeRanking, getMostBeersRanking, getHighestAbvRanking, getMostDistinctBeersRanking } from '../lib/stats';
import { getAllDisplayNames } from '../lib/profiles';
import { DrinkLog, RankingEntry, TimeRange, TimeRangePreset } from '../types';
import { getThisWeekRange, getLastWeekRange, getThisMonthRange, getLastMonthRange } from '../lib/dates';
import TimeRangeSelector from '../components/TimeRangeSelector';
import RankingCard from '../components/Rankings/RankingCard';

function applyDisplayNames(entries: RankingEntry[], names: Map<string, string>): RankingEntry[] {
  return entries.map((e) => ({
    ...e,
    email: names.get(e.userId) ?? e.email.split('@')[0],
  }));
}

export default function HomePage() {
  const { displayName } = useAuth();
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState<TimeRangePreset>('this-week');
  const [customRange, setCustomRange] = useState<TimeRange>(getThisWeekRange());

  useEffect(() => {
    Promise.all([getAllLogs(), getAllDisplayNames()])
      .then(([l, n]) => { setLogs(l); setNames(n); })
      .finally(() => setLoading(false));
  }, []);

  function getRange(): TimeRange {
    switch (preset) {
      case 'this-week':  return getThisWeekRange();
      case 'last-week':  return getLastWeekRange();
      case 'this-month': return getThisMonthRange();
      case 'last-month': return getLastMonthRange();
      case 'custom':     return customRange;
    }
  }

  const range = getRange();
  const volumeRanking   = applyDisplayNames(getMostVolumeRanking(logs, range), names);
  const beersRanking    = applyDisplayNames(getMostBeersRanking(logs, range), names);
  const abvRanking      = applyDisplayNames(getHighestAbvRanking(logs, range), names);
  const distinctRanking = applyDisplayNames(getMostDistinctBeersRanking(logs, range), names);

  return (
    <>
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-subtitle">
        Hey <strong>{displayName}</strong> — see how everyone's doing.
      </p>

      <TimeRangeSelector
        preset={preset}
        onPresetChange={setPreset}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="rankings-grid">
          <RankingCard title="Most beer (litres)" entries={volumeRanking} />
          <RankingCard title="Most beers (count)" entries={beersRanking} />
          <RankingCard title="Highest ABV" entries={abvRanking} />
          <RankingCard title="Most unique beers" entries={distinctRanking} />
        </div>
      )}
    </>
  );
}
