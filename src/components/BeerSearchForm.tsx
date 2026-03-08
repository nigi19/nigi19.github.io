import { useEffect, useState } from 'react';
import { SearchParams } from '../routes/BeersPage';

interface Props {
  params: SearchParams;
  styles: string[];
  onChange: (p: SearchParams) => void;
}

const DEBOUNCE_MS = 300;

export default function BeerSearchForm({ params, styles, onChange }: Props) {
  // Local query state for debouncing — only the text field is debounced.
  const [localQuery, setLocalQuery] = useState(params.query);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== params.query) {
        onChange({ ...params, query: localQuery });
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [localQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search beer name or brewery…"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
      />

      <select
        value={params.style}
        onChange={(e) => onChange({ ...params, style: e.target.value })}
      >
        <option value="">All styles</option>
        {styles.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="abv-range">
        <input
          type="number"
          placeholder="Min ABV"
          value={params.minAbv}
          min={0}
          max={100}
          step={0.1}
          onChange={(e) => onChange({ ...params, minAbv: e.target.value })}
          style={{ width: 80 }}
        />
        <span style={{ color: 'var(--color-text-muted)' }}>–</span>
        <input
          type="number"
          placeholder="Max ABV"
          value={params.maxAbv}
          min={0}
          max={100}
          step={0.1}
          onChange={(e) => onChange({ ...params, maxAbv: e.target.value })}
          style={{ width: 80 }}
        />
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>% ABV</span>
      </div>
    </div>
  );
}
