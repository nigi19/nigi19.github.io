import { useAuth } from '../context/AuthContext';

export default function DebugPage() {
  const { session } = useAuth();

  return (
    <>
      <h1 className="page-title">Debug / Dev</h1>
      <p className="page-subtitle" style={{ color: 'var(--color-danger)' }}>
        Development info — for debugging use only.
      </p>

      <div className="section-title">Current session</div>
      <pre className="debug-code">{JSON.stringify(session, null, 2)}</pre>
    </>
  );
}
