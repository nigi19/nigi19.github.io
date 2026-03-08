import { TimeRange, TimeRangePreset } from '../types';

interface Props {
  preset: TimeRangePreset;
  onPresetChange: (p: TimeRangePreset) => void;
  customRange: TimeRange;
  onCustomRangeChange: (r: TimeRange) => void;
}

const PRESETS: { key: TimeRangePreset; label: string }[] = [
  { key: 'this-week',  label: 'This week'  },
  { key: 'last-week',  label: 'Last week'  },
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'custom',     label: 'Custom'     },
];

/** Format a Date to the value expected by <input type="date">. */
function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function TimeRangeSelector({ preset, onPresetChange, customRange, onCustomRangeChange }: Props) {
  return (
    <div className="time-range-selector">
      {PRESETS.map(({ key, label }) => (
        <button
          key={key}
          className={'time-range-btn' + (preset === key ? ' active' : '')}
          onClick={() => onPresetChange(key)}
        >
          {label}
        </button>
      ))}

      {preset === 'custom' && (
        <div className="custom-range-inputs">
          <input
            type="date"
            value={toDateInput(customRange.from)}
            onChange={(e) =>
              onCustomRangeChange({
                from: new Date(e.target.value + 'T00:00:00'),
                to: customRange.to,
              })
            }
          />
          <span style={{ color: 'var(--color-text-muted)' }}>→</span>
          <input
            type="date"
            value={toDateInput(customRange.to)}
            onChange={(e) =>
              onCustomRangeChange({
                from: customRange.from,
                to: new Date(e.target.value + 'T23:59:59'),
              })
            }
          />
        </div>
      )}
    </div>
  );
}
