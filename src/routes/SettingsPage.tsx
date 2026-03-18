import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { upsertDisplayName } from '../lib/profiles';

export default function SettingsPage() {
  const { session, displayName, refreshDisplayName, logout } = useAuth();
  const navigate = useNavigate();

  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  useEffect(() => {
    if (displayName) setNameInput(displayName);
  }, [displayName]);

  async function handleSaveName() {
    if (!session || !nameInput.trim()) return;
    setNameSaving(true);
    try {
      await upsertDisplayName(session.userId, nameInput.trim());
      refreshDisplayName();
      setNameMsg('Saved!');
      setTimeout(() => setNameMsg(''), 2000);
    } catch (err) {
      setNameMsg(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setNameSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">{session?.email}</p>

      <div className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Display name</div>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
          This name is shown on the leaderboard and throughout the app.
        </p>
        <div className="form-group">
          <label htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your display name"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleSaveName}
            disabled={nameSaving || !nameInput.trim()}
          >
            {nameSaving ? 'Saving…' : 'Save'}
          </button>
          {nameMsg && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>{nameMsg}</span>
          )}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Account</div>
        <button className="btn btn-danger" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </>
  );
}
