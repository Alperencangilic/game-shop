import { Fragment, useState } from 'react';
import { api } from '../../api.js';
import { ErrorBox, Loading } from '../../components/Loading.jsx';
import ReasonButton from '../../components/ReasonButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useLiveEvent } from '../../context/LiveContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useBrowser.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { downloadCsv } from '../../utils/csv.js';
import { formatDateTime, formatMoney } from '../../utils/format.js';
import { DENIED_MESSAGES } from '../../utils/permissions.js';

export default function AdminOrders() {
  useDocumentTitle('Orders');
  const { can } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(null);
  const query = useDebounce(search, 300).trim();
  const qs = new URLSearchParams({ ...(status !== 'all' && { status }), ...(query && { search: query }) }).toString();
  const { data, error, loading, reload } = useApi(`/admin/orders${qs ? `?${qs}` : ''}`);

  useLiveEvent((event) => {
    if (event.type === 'orders-changed') reload({ quiet: true });
  });

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const orders = data.orders;

  const refund = async (order) => {
    const ok = await confirm({
      title: `Refund order #${order.id}?`,
      message: `${formatMoney(order.totalCents)} will go back to ${order.userName}'s wallet.`,
      details: [`Removed from library: ${order.items.map((i) => i.title).join(', ')}`, 'Keys go back to stock.'],
      confirmLabel: 'Refund',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      toast.success((await api.post(`/admin/orders/${order.id}/refund`)).message);
      reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const refundReason = (order) => {
    if (!can('orders.refund')) return DENIED_MESSAGES['orders.refund'];
    if (order.status === 'refunded') return 'This order was already refunded.';
    return null;
  };

  const exportCsv = () =>
    downloadCsv('orders.csv', orders, [
      { label: 'Order', value: (o) => o.id },
      { label: 'Date', value: (o) => o.createdAt },
      { label: 'Customer', value: (o) => o.userName },
      { label: 'Email', value: (o) => o.userEmail },
      { label: 'Products', value: (o) => o.items.map((i) => i.title).join('; ') },
      { label: 'Total', value: (o) => (o.totalCents / 100).toFixed(2) },
      { label: 'Status', value: (o) => o.status },
    ]);

  return (
    <div>
      <div className="page-head">
        <h1>Orders ({orders.length})</h1>
        <button type="button" className="btn btn-outline" onClick={exportCsv}>
          Export CSV
        </button>
      </div>
      <div className="toolbar">
        <input className="search" placeholder="Search customer, email, product or #id" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <Fragment key={o.id}>
              <tr>
                <td>
                  <button type="button" className="btn-link" onClick={() => setOpen(open === o.id ? null : o.id)}>
                    {open === o.id ? '▼' : '▶'} {o.id}
                  </button>
                </td>
                <td>{formatDateTime(o.createdAt)}</td>
                <td>
                  {o.userName}
                  <div className="muted small">{o.userEmail}</div>
                </td>
                <td>{formatMoney(o.totalCents)}</td>
                <td>
                  <span className={`badge ${o.status === 'paid' ? 'badge-green' : 'badge-orange'}`}>{o.status}</span>
                </td>
                <td>
                  <ReasonButton reason={refundReason(o)} className="btn btn-sm btn-outline" onClick={() => refund(o)}>
                    Refund
                  </ReasonButton>
                </td>
              </tr>
              {open === o.id && (
                <tr>
                  <td colSpan={6}>
                    {o.items.map((i) => (
                      <div key={i.gameId}>
                        {i.title} - {formatMoney(i.paidCents)} {i.discountPercent > 0 && `(-${i.discountPercent}%)`}
                      </div>
                    ))}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
