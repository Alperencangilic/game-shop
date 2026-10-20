import { useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';
import { Alert, Loading } from '../../components/Loading.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useBrowser.js';
import { formatDateTime } from '../../utils/format.js';

const TYPES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];

// Shows the SQL queries run by the server (checks for new ones every 1.5 s)
function SqlLog() {
  const [entries, setEntries] = useState([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('all');
  const lastId = useRef(0);

  useEffect(() => {
    if (paused) return undefined;
    const poll = async () => {
      try {
        const { entries: fresh } = await api.get(`/admin/logs/queries?since=${lastId.current}`);
        if (fresh.length) {
          lastId.current = fresh[fresh.length - 1].id;
          setEntries((old) => [...fresh.reverse(), ...old].slice(0, 300));
        }
      } catch {}
    };
    poll();
    const timer = setInterval(poll, 1500);
    return () => clearInterval(timer);
  }, [paused]);

  const clear = async () => {
    await api.del('/admin/logs/queries').catch(() => {});
    setEntries([]);
  };

  const shown = filter === 'all' ? entries : entries.filter((e) => e.type === filter);
  return (
    <div>
      <Alert type="info">Every action on the website runs SQL queries. Use the store in another tab and watch the INSERT / UPDATE / DELETE queries here.</Alert>
      <div className="toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All ({entries.length})</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t} ({entries.filter((e) => e.type === t).length})
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setPaused(!paused)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={clear}>
          Clear
        </button>
      </div>
      <div className="sql-log">
        {shown.map((e) => (
          <div key={e.id} className="row">
            <span className={`badge type-${e.type}`}>{e.type}</span> {e.sql}
            <div className="muted">
              {e.rows !== undefined ? `${e.rows} rows` : `${e.changes} changed`} | {e.ms} ms | {new Date(e.at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLog() {
  const { data, loading, reload } = useApi('/admin/logs/audit');
  if (loading && !data) return <Loading />;
  return (
    <div>
      <button type="button" className="btn btn-sm btn-secondary" onClick={() => reload()}>
        Refresh
      </button>
      <table className="table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {(data?.entries ?? []).map((e) => (
            <tr key={e.id}>
              <td>{formatDateTime(e.createdAt)}</td>
              <td>{e.userName}</td>
              <td>
                <code>{e.action}</code>
              </td>
              <td>{e.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Activity() {
  useDocumentTitle('Logs');
  const [tab, setTab] = useState('sql');
  return (
    <div>
      <h1>Logs</h1>
      <Tabs
        tabs={[
          { id: 'sql', label: 'SQL queries (live)' },
          { id: 'audit', label: 'Admin actions' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'sql' ? <SqlLog /> : <AuditLog />}
    </div>
  );
}
