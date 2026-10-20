import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useLiveEvent } from '../context/LiveContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDismiss } from '../hooks/useBrowser.js';
import { formatRelative } from '../utils/format.js';

export default function NotificationBell() {
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { data, reload, setData } = useApi('/notifications');
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);

  useLiveEvent((event) => {
    if (event.type !== 'notification') return;
    reload({ quiet: true });
    if (event.kind === 'success') return; // own actions already show a message
    toast.info(event.message, event.link ? { action: { label: 'Open', onClick: () => navigate(event.link) } } : undefined);
  });

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  const openItem = async (item) => {
    if (!item.read) await api.patch(`/notifications/${item.id}/read`).catch(() => {});
    reload({ quiet: true });
    close();
    if (item.link) navigate(item.link);
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    reload({ quiet: true });
  };

  const remove = async (item) => {
    await api.del(`/notifications/${item.id}`).catch(() => {});
    reload({ quiet: true });
  };

  const clearAll = async () => {
    await api.del('/notifications').catch(() => {});
    setData({ items: [], unread: 0 });
  };

  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="nav-button" onClick={() => setOpen(!open)}>
        Notifications {unread > 0 && <span className="badge badge-red">{unread}</span>}
      </button>
      {open && (
        <div className="dropdown-menu notifications">
          <div className="dropdown-info">
            <b>Notifications</b>{' '}
            {unread > 0 && (
              <button type="button" className="btn-link" onClick={markAll}>
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 && <p className="muted small">No notifications.</p>}
          {items.map((item) => (
            <div key={item.id} className={`notification ${item.read ? '' : 'unread'}`}>
              <button type="button" onClick={() => openItem(item)}>
                {item.message}
                <div className="muted small">{formatRelative(item.createdAt)}</div>
              </button>
              <button type="button" className="btn-link" onClick={() => remove(item)} aria-label="Delete">
                ×
              </button>
            </div>
          ))}
          {items.length > 0 && (
            <button type="button" className="btn-link" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
