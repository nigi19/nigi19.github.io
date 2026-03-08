import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllLogs, getMostVolumeRanking, getMostBeersRanking, getHighestAbvRanking, getMostDistinctBeersRanking } from '../lib/stats';
import { DrinkLog, TimeRange, TimeRangePreset } from '../types';
import { getThisWeekRange, getLastWeekRange, getThisMonthRange, getLastMonthRange } from '../lib/dates';
import TimeRangeSelector from '../components/TimeRangeSelector';
import RankingCard from '../components/Rankings/RankingCard';

export default function HomePage() {
  const { session } = useAuth();
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState<TimeRangePreset>('this-week');
  const [customRange, setCustomRange] = useState<TimeRange>(getThisWeekRange());

  useEffect(() => {
    getAllLogs()
      .then(setLogs)
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
  const volumeRanking   = getMostVolumeRanking(logs, range);
  const beersRanking    = getMostBeersRanking(logs, range);
  const abvRanking      = getHighestAbvRanking(logs, range);
  const distinctRanking = getMostDistinctBeersRanking(logs, range);

  return (
    <>
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-subtitle">
        Hey <strong>{session?.email.split('@')[0]}</strong> — see how everyone's doing.
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
