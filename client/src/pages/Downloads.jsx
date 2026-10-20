import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { EmptyState, ErrorBox, Loading } from '../components/Loading.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useBrowser.js';
import { formatDateTime } from '../utils/format.js';

export default function Downloads() {
  useDocumentTitle('Download history');
  const confirm = useConfirm();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApi('/downloads');

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const items = data.items;

  const removeOne = async (item) => {
    try {
      await api.del(`/downloads/${item.id}`);
      setData({ items: items.filter((i) => i.id !== item.id) });
      toast.info('Entry removed.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const clearAll = async () => {
    const ok = await confirm({
      title: 'Clear download history?',
      message: `${items.length} entries will be deleted. Your games and keys are not deleted.`,
      confirmLabel: 'Clear',
      tone: 'danger',
    });
    if (!ok) return;
    await api.del('/downloads');
    setData({ items: [] });
    toast.success('Download history cleared.');
  };

  return (
    <div>
      <div className="page-head">
        <h1>Download history</h1>
        {items.length > 0 && (
          <button type="button" className="btn btn-outline" onClick={clearAll}>
            Clear history
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState title="No downloads yet" action={<Link to="/library">Go to library</Link>} />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>File</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/games/${item.gameId}`}>{item.title}</Link>
                </td>
                <td>
                  <code>{item.fileName}</code>
                </td>
                <td>{formatDateTime(item.downloadedAt)}</td>
                <td>
                  <button type="button" className="btn-link danger" onClick={() => removeOne(item)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
