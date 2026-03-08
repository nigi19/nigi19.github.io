import { RankingEntry } from '../../types';
import { displayName } from '../../lib/auth';

interface Props {
  title: string;
  entries: RankingEntry[];
}

export default function RankingCard({ title, entries }: Props) {
  return (
    <div className="card ranking-card">
      <div className="ranking-card__title">{title}</div>

      {entries.length === 0 ? (
        <div className="ranking-empty">No data yet</div>
      ) : (
        entries.slice(0, 5).map((entry, i) => (
          <div key={entry.userId} className="ranking-row">
            <span className="ranking-row__pos">#{i + 1}</span>
            <span className="ranking-row__name" title={entry.email}>
              {displayName(entry.email)}
            </span>
            <span className="ranking-row__value">{entry.formattedValue}</span>
          </div>
        ))
      )}
    </div>
  );
}
