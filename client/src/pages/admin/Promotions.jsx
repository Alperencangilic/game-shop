import { useState } from 'react';
import { api } from '../../api.js';
import PromotionForm from '../../components/admin/PromotionForm.jsx';
import Countdown from '../../components/Countdown.jsx';
import { ErrorBox, Loading } from '../../components/Loading.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useBrowser.js';
import { formatDateTime } from '../../utils/format.js';

export default function Promotions() {
  useDocumentTitle('Promotions');
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useApi('/admin/promotions');
  const games = useApi('/admin/games');
  const [tab, setTab] = useState('live');
  const [editing, setEditing] = useState(null);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const promotions = data.promotions;
  const shown = tab === 'all' ? promotions : promotions.filter((p) => p.status === tab);
  const count = (s) => promotions.filter((p) => p.status === s).length;
  const target = (p) => (p.target === 'store' ? 'Whole store' : p.target === 'genre' ? `Category: ${p.genre}` : p.gameTitle);

  const endNow = async (p) => {
    if (!(await confirm({ title: 'End promotion', message: `End "${p.name}" now? Prices go back to normal.`, confirmLabel: 'End now', tone: 'warning' }))) return;
    try {
      toast.success((await api.post(`/admin/promotions/${p.id}/end`)).message);
      reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (p) => {
    if (!(await confirm({ title: 'Delete promotion', message: `Delete "${p.name}"?`, confirmLabel: 'Delete', tone: 'danger' }))) return;
    try {
      toast.success((await api.del(`/admin/promotions/${p.id}`)).message);
      reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Promotions</h1>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')} disabled={!games.data}>
          + New promotion
        </button>
      </div>
      <Tabs
        tabs={[
          { id: 'live', label: 'Active', count: count('live') },
          { id: 'scheduled', label: 'Scheduled', count: count('scheduled') },
          { id: 'ended', label: 'Ended', count: count('ended') },
          { id: 'all', label: 'All', count: promotions.length },
        ]}
        active={tab}
        onChange={setTab}
      />
      {shown.length === 0 ? (
        <p className="muted">No promotions here.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Applies to</th>
              <th>Discount</th>
              <th>Start - End</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.name}</b>
                  <div className="muted small">by {p.createdBy ?? '-'}</div>
                </td>
                <td>
                  {target(p)} ({p.gameCount})
                </td>
                <td>
                  <b>{p.discountPercent}%</b>
                </td>
                <td className="small">
                  {formatDateTime(p.startsAt)}
                  <br />
                  {formatDateTime(p.endsAt)}
                </td>
                <td>
                  {p.status}
                  <br />
                  {p.status === 'live' && <Countdown endsAt={p.endsAt} />}
                  {p.status === 'scheduled' && <Countdown endsAt={p.startsAt} label="Starts in" />}
                </td>
                <td>
                  {p.status !== 'ended' && (
                    <button type="button" className="btn-link" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                  )}
                  {p.status === 'live' && (
                    <button type="button" className="btn-link" onClick={() => endNow(p)}>
                      End now
                    </button>
                  )}
                  <button type="button" className="btn-link danger" onClick={() => remove(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing && games.data && (
        <PromotionForm
          promotion={editing === 'new' ? null : editing}
          games={games.data.games}
          promotions={promotions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload({ quiet: true });
          }}
        />
      )}
    </div>
  );
}
