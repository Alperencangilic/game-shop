import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import BarChart from '../../components/admin/BarChart.jsx';
import LineChart from '../../components/admin/LineChart.jsx';
import { ErrorBox, Loading } from '../../components/Loading.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLiveEvent } from '../../context/LiveContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useBrowser.js';
import { daysAgo, formatMoney, formatRelative, toDayString } from '../../utils/format.js';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user, can } = useAuth();
  const toast = useToast();
  const range = `from=${daysAgo(29)}&to=${toDayString(new Date())}`;
  const summary = useApi(`/admin/reports/summary?${range}`);
  const daily = useApi(`/admin/reports/sales-by-day?${range}`);
  const best = useApi(`/admin/reports/best-sellers?${range}&limit=5`);
  const lowStock = useApi('/admin/reports/low-stock');
  const orders = useApi(can('orders.view') ? '/admin/orders' : null);

  useLiveEvent((event) => {
    if (['orders-changed', 'game-updated', 'catalog-changed'].includes(event.type)) {
      [summary, daily, best, lowStock, orders].forEach((x) => x.reload({ quiet: true }));
    }
  });

  if (summary.loading && !summary.data) return <Loading />;
  if (summary.error) return <ErrorBox error={summary.error} onRetry={summary.reload} />;
  const s = summary.data.summary;

  const restock = async (game) => {
    try {
      await api.patch(`/admin/games/${game.id}`, { stock: game.stock + 10 });
      toast.success(`${game.title}: stock is now ${game.stock + 10}.`);
      lowStock.reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">Welcome, {user.name}. Numbers are for the last 30 days.</p>

      <div className="stats">
        <div className="card stat">
          <div className="muted">Revenue</div>
          <div className="value">{formatMoney(s.revenueCents)}</div>
          <div className="small">{s.orders} orders</div>
        </div>
        <div className="card stat">
          <div className="muted">Items sold</div>
          <div className="value">{s.units}</div>
          <div className="small">Avg. order {formatMoney(s.averageOrderCents)}</div>
        </div>
        <div className="card stat">
          <div className="muted">Customers</div>
          <div className="value">{s.customers}</div>
          <div className="small">{s.buyers} bought something</div>
        </div>
        <div className="card stat">
          <div className="muted">Stock</div>
          <div className="value">{s.keysInStock}</div>
          <div className={s.outOfStock > 0 ? 'error-text' : 'small'}>
            {s.lowStock} low, {s.outOfStock} sold out
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Daily revenue</h3>
        {daily.data ? (
          <LineChart data={daily.data.days.map((d) => ({ label: d.day, value: d.revenueCents / 100 }))} format={(v) => `$${Math.round(v)}`} />
        ) : (
          <Loading />
        )}
      </div>

      <div className="two-cols">
        <div className="card">
          <h3>Top 5 best sellers</h3>
          {best.data ? <BarChart data={best.data.rows.map((r) => ({ label: r.title, value: r.units }))} format={(v) => `${v} sold`} /> : <Loading />}
          <Link to="/admin/reports">See full report</Link>
        </div>
        <div className="card">
          <h3>Low stock ({lowStock.data?.limit ?? 5} or less)</h3>
          {(lowStock.data?.rows ?? []).length === 0 ? (
            <p className="muted">Everything is in stock.</p>
          ) : (
            <table className="table">
              <tbody>
                {lowStock.data.rows.map((g) => (
                  <tr key={g.id}>
                    <td>{g.title}</td>
                    <td className={g.stock === 0 ? 'error-text' : 'warning-text'}>{g.stock === 0 ? 'Sold out' : `${g.stock} left`}</td>
                    <td>
                      {can('games.manage') && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => restock(g)}>
                          +10
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {can('orders.view') && (
        <div className="card" style={{ marginTop: 15 }}>
          <h3>Latest orders</h3>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Total</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {(orders.data?.orders ?? []).slice(0, 6).map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.userName}</td>
                  <td>{o.items.map((i) => i.title).join(', ')}</td>
                  <td>{formatMoney(o.totalCents)}</td>
                  <td>{o.status}</td>
                  <td>{formatRelative(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
