import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllLogs } from '../lib/stats';
import { getAllUsers } from '../lib/auth';
import {
  getMostVolumeRanking,
  getMostBeersRanking,
  getHighestAbvRanking,
  getMostDistinctBeersRanking,
} from '../lib/stats';
import { TimeRange, TimeRangePreset } from '../types';
import {
  getThisWeekRange,
  getLastWeekRange,
  getThisMonthRange,
  getLastMonthRange,
} from '../lib/dates';
import TimeRangeSelector from '../components/TimeRangeSelector';
import RankingCard from '../components/Rankings/RankingCard';

export default function HomePage() {
  const { session } = useAuth();

  const [preset, setPreset] = useState<TimeRangePreset>('this-week');
  const [customRange, setCustomRange] = useState<TimeRange>(getThisWeekRange());

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
  const logs = getAllLogs();
  const users = getAllUsers();

  const volumeRanking   = getMostVolumeRanking(logs, users, range);
  const beersRanking    = getMostBeersRanking(logs, users, range);
  const abvRanking      = getHighestAbvRanking(logs, users, range);
  const distinctRanking = getMostDistinctBeersRanking(logs, users, range);

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

      <div className="rankings-grid">
        <RankingCard title="Most beer (litres)" entries={volumeRanking} />
        <RankingCard title="Most beers (count)" entries={beersRanking} />
        <RankingCard title="Highest ABV" entries={abvRanking} />
        <RankingCard title="Most unique beers" entries={distinctRanking} />
      </div>
    </>
  );
}
