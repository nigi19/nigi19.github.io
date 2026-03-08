import { useState } from 'react';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { exportLogsJson, importLogsJson, clearAllData } from '../lib/stats';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DebugPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');

  const users = storage.get(STORAGE_KEYS.USERS);
  const logs = storage.get(STORAGE_KEYS.LOGS);
  const session = storage.get(STORAGE_KEYS.SESSION);

  function handleExport() {
    const json = exportLogsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beertracker-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = importLogsJson(e.target?.result as string);
          setMsg(`Imported ${result.imported} new log(s).`);
        } catch {
          setMsg('Import failed — invalid JSON.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handleClear() {
    if (!window.confirm('This will delete ALL users, logs, and the current session. Are you sure?')) return;
    clearAllData();
    logout();
    navigate('/login');
  }

  return (
    <>
      <h1 className="page-title">Debug / Dev</h1>
      <p className="page-subtitle" style={{ color: 'var(--color-danger)' }}>
        Raw localStorage data — for development use only.
      </p>

      {msg && <div className="alert alert-info" style={{ marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={handleExport}>Export logs JSON</button>
        <button className="btn btn-secondary" onClick={handleImport}>Import logs JSON</button>
        <button className="btn btn-danger" onClick={handleClear}>Clear all data</button>
      </div>

      <div className="section-title">Session</div>
      <pre className="debug-code">{JSON.stringify(session, null, 2)}</pre>

      <div className="section-title">Users</div>
      <pre className="debug-code">{JSON.stringify(users, null, 2)}</pre>

      <div className="section-title">Drink logs</div>
      <pre className="debug-code">{JSON.stringify(logs, null, 2)}</pre>
    </>
  );
}
