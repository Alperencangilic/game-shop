import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorBox, Loading } from '../components/Loading.jsx';
import Tabs from '../components/Tabs.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useBrowser.js';
import { formatDateTime, formatMoney } from '../utils/format.js';

export default function Orders() {
  useDocumentTitle('My orders');
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi('/orders');
  const [status, setStatus] = useState('all');
  const [printing, setPrinting] = useState(null);

  useEffect(() => {
    if (!printing) return undefined;
    const done = () => setPrinting(null);
    window.addEventListener('afterprint', done);
    const timer = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', done);
    };
  }, [printing]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const orders = data.orders;
  const shown = status === 'all' ? orders : orders.filter((o) => o.status === status);

  return (
    <div className={printing ? 'printing' : ''}>
      <h1>My orders</h1>
      {orders.length === 0 ? (
        <EmptyState title="No orders yet" action={<Link to="/" className="btn btn-primary">Go to store</Link>} />
      ) : (
        <>
          <div className="no-print">
            <Tabs
              tabs={[
                { id: 'all', label: 'All', count: orders.length },
                { id: 'paid', label: 'Paid', count: orders.filter((o) => o.status === 'paid').length },
                { id: 'refunded', label: 'Refunded', count: orders.filter((o) => o.status === 'refunded').length },
              ]}
              active={status}
              onChange={setStatus}
            />
          </div>
          {shown.map((order) => (
            <div key={order.id} className={`card order ${printing === order.id ? 'print-me' : ''}`} style={{ marginBottom: 12 }}>
              <div className="page-head">
                <b>
                  Order #{order.id} - {formatDateTime(order.createdAt)}
                </b>
                <span>
                  <span className={`badge ${order.status === 'paid' ? 'badge-green' : 'badge-orange'}`}>{order.status}</span> <b>{formatMoney(order.totalCents)}</b>
                </span>
              </div>
              <table className="table" style={{ marginTop: 8 }}>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.gameId}>
                      <td>{item.title}</td>
                      <td className="right">
                        {item.discountPercent > 0 && <s className="muted">{formatMoney(item.unitPriceCents)} </s>}
                        {formatMoney(item.paidCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {order.status === 'refunded' && <p className="warning-text small">Refunded on {formatDateTime(order.refundedAt)}. The money was returned to your wallet.</p>}
              <p className="small muted">Customer: {user.name} ({user.email})</p>
              <button type="button" className="btn btn-sm btn-outline no-print" onClick={() => setPrinting(order.id)}>
                Print receipt
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
