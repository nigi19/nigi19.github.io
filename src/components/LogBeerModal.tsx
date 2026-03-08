import { useState, FormEvent } from 'react';
import { Beer } from '../types';
import { addLog } from '../lib/stats';
import { useAuth } from '../context/AuthContext';

interface Props {
  beer: Beer;
  onClose: () => void;
  onLogged: () => void;
}

/** Format a Date to the value expected by <input type="datetime-local">. */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LogBeerModal({ beer, onClose, onLogged }: Props) {
  const { session } = useAuth();
  const [volumeMl, setVolumeMl] = useState(330);
  const [consumedAt, setConsumedAt] = useState(toDatetimeLocal(new Date()));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (volumeMl <= 0 || volumeMl > 5000) {
      setError('Volume must be between 1 and 5000 ml.');
      return;
    }
    setSaving(true);
    try {
      await addLog(session.userId, session.email, beer, volumeMl, new Date(consumedAt));
      onLogged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log beer.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Log beer</h2>
        <div className="modal-beer-info">
          {beer.name} — {beer.brewery} · {beer.abv.toFixed(1)}% ABV
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="volume">Volume (ml)</label>
            <input
              id="volume"
              type="number"
              value={volumeMl}
              min={1}
              max={5000}
              onChange={(e) => setVolumeMl(Number(e.target.value))}
              required
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {[150, 250, 330, 500, 750].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setVolumeMl(v)}
                  style={{ flex: 1 }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date & time</label>
            <input
              id="date"
              type="datetime-local"
              value={consumedAt}
              onChange={(e) => setConsumedAt(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Saving…' : 'Log it!'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
