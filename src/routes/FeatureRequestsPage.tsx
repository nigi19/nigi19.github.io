import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FeatureRequest,
  Priority,
  getFeatureRequests,
  addFeatureRequest,
  resolveRequest,
  castVote,
} from '../lib/featureRequests';

const PRIORITY_ORDER: Record<Priority, number> = { low: 1, medium: 2, high: 3 };
const PRIORITY_LABEL: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

type SortField = 'votes' | 'priority';
type SortOrder = 'asc' | 'desc';

function RequestCard({
  req,
  isAdmin,
  onVote,
  onResolve,
}: {
  req: FeatureRequest;
  isAdmin: boolean;
  onVote: (req: FeatureRequest, value: 1 | -1) => void;
  onResolve?: (req: FeatureRequest) => void;
}) {
  return (
    <div className={'card fr-card' + (req.isResolved ? ' fr-card--resolved' : '')}>
      <div className="fr-votes">
        <button
          className={'fr-vote-btn' + (req.userVote === 1 ? ' active-up' : '')}
          onClick={() => onVote(req, 1)}
          title="Upvote"
          disabled={req.isResolved}
        >▲</button>
        <span className="fr-score">{req.score}</span>
        <button
          className={'fr-vote-btn' + (req.userVote === -1 ? ' active-down' : '')}
          onClick={() => onVote(req, -1)}
          title="Downvote"
          disabled={req.isResolved}
        >▼</button>
      </div>

      <div className="fr-content">
        <div className="fr-header">
          <span className="fr-title">{req.title}</span>
          <span className={'fr-priority fr-priority--' + req.priority}>
            {PRIORITY_LABEL[req.priority]}
          </span>
          {req.isResolved && <span className="fr-resolved-badge">Resolved</span>}
        </div>
        {req.description && <p className="fr-description">{req.description}</p>}
        <div className="fr-footer">
          <p className="fr-meta">Submitted by {req.userDisplayName}</p>
          {isAdmin && !req.isResolved && onResolve && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onResolve(req)}
            >
              Mark resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeatureRequestsPage() {
  const { session, displayName, isAdmin } = useAuth();

  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sortField, setSortField] = useState<SortField>('votes');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function load() {
    if (!session) return;
    setLoading(true);
    getFeatureRequests(session.userId)
      .then(setRequests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [session]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session || !title.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await addFeatureRequest(session.userId, displayName, title.trim(), description.trim(), priority);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setShowForm(false);
      load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(req: FeatureRequest) {
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id ? { ...r, isResolved: true, resolvedAt: new Date().toISOString() } : r,
      ),
    );
    try {
      await resolveRequest(req.id);
    } catch {
      load(); // revert on error
    }
  }

  async function handleVote(req: FeatureRequest, value: 1 | -1) {
    if (!session) return;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== req.id) return r;
        const removing = r.userVote === value;
        return {
          ...r,
          score: r.score - r.userVote + (removing ? 0 : value),
          userVote: removing ? 0 : value,
        };
      }),
    );
    try {
      await castVote(session.userId, req.id, value, req.userVote);
    } catch {
      load();
    }
  }

  function applySorting(list: FeatureRequest[]): FeatureRequest[] {
    return [...list].sort((a, b) => {
      const mul = sortOrder === 'desc' ? -1 : 1;
      if (sortField === 'priority') {
        return mul * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      }
      return mul * (a.score - b.score);
    });
  }

  function toggleOrder(field: SortField) {
    if (sortField === field) {
      setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }

  const arrow = (field: SortField) =>
    sortField === field ? (sortOrder === 'desc' ? ' ↓' : ' ↑') : '';

  const open = applySorting(requests.filter((r) => !r.isResolved));
  const resolved = requests
    .filter((r) => r.isResolved)
    .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime())
    .slice(0, 5);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 className="page-title">Feature Requests</h1>
          <p className="page-subtitle">Suggest and vote on new features.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New request'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>New feature request</h2>
          {submitError && <div className="alert alert-error">{submitError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fr-title">Title *</label>
              <input
                id="fr-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short description of the feature"
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fr-desc">Description</label>
              <textarea
                id="fr-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="More details, use cases, etc."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="fr-priority">Priority</label>
              <select
                id="fr-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sort controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>Sort by:</span>
        <button
          className={'btn btn-sm ' + (sortField === 'votes' ? 'btn-primary' : 'btn-secondary')}
          onClick={() => toggleOrder('votes')}
        >
          Votes{arrow('votes')}
        </button>
        <button
          className={'btn btn-sm ' + (sortField === 'priority' ? 'btn-primary' : 'btn-secondary')}
          onClick={() => toggleOrder('priority')}
        >
          Priority{arrow('priority')}
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <>
          {/* Open requests */}
          {open.length === 0 ? (
            <div className="card" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: 32 }}>
              No open feature requests yet. Be the first!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {open.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  isAdmin={isAdmin}
                  onVote={handleVote}
                  onResolve={handleResolve}
                />
              ))}
            </div>
          )}

          {/* Resolved requests */}
          {resolved.length > 0 && (
            <>
              <div className="section-title">Recently resolved</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {resolved.map((req) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    isAdmin={isAdmin}
                    onVote={handleVote}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
