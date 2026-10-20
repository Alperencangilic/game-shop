import { useState } from 'react';
import BarChart from '../../components/admin/BarChart.jsx';
import LineChart from '../../components/admin/LineChart.jsx';
import { ErrorBox, Loading } from '../../components/Loading.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useBrowser.js';
import { useMeta } from '../../hooks/useMeta.js';
import { downloadCsv } from '../../utils/csv.js';
import { daysAgo, formatMoney, toDayString } from '../../utils/format.js';

function getRange(period, custom) {
  if (period === 'all') return { from: '', to: '' };
  if (period === 'custom') return custom;
  return { from: daysAgo(Number(period) - 1), to: toDayString(new Date()) };
}

export default function Reports() {
  useDocumentTitle('Reports');
  const meta = useMeta();
  const [period, setPeriod] = useState('30');
  const [custom, setCustom] = useState({ from: daysAgo(6), to: toDayString(new Date()) });
  const [genre, setGenre] = useState('all');
  const [limit, setLimit] = useState(10);

  const range = getRange(period, custom);
  const invalid = range.from && range.to && range.from > range.to;
  const qs = new URLSearchParams({ ...(range.from && { from: range.from }), ...(range.to && { to: range.to }) }).toString();

  const summary = useApi(invalid ? null : `/admin/reports/summary?${qs}`);
  const best = useApi(invalid ? null : `/admin/reports/best-sellers?${qs}&limit=${limit}&genre=${encodeURIComponent(genre)}`);
  const daily = useApi(invalid ? null : `/admin/reports/sales-by-day?${qs}`);
  const genres = useApi(invalid ? null : `/admin/reports/revenue-by-genre?${qs}`);
  const customers = useApi(invalid ? null : `/admin/reports/top-customers?${qs}`);

  const s = summary.data?.summary;
  const rows = best.data?.rows ?? [];

  const exportBest = () =>
    downloadCsv('best-sellers.csv', rows, [
      { label: 'Rank', value: (r) => rows.indexOf(r) + 1 },
      { label: 'Product', value: (r) => r.title },
      { label: 'Category', value: (r) => r.genre },
      { label: 'Sold', value: (r) => r.units },
      { label: 'Revenue', value: (r) => (r.revenueCents / 100).toFixed(2) },
    ]);

  const exportDaily = () =>
    downloadCsv('daily-sales.csv', daily.data?.days ?? [], [
      { label: 'Date', value: (d) => d.day },
      { label: 'Orders', value: (d) => d.orders },
      { label: 'Items', value: (d) => d.units },
      { label: 'Revenue', value: (d) => (d.revenueCents / 100).toFixed(2) },
    ]);

  return (
    <div>
      <div className="page-head">
        <h1>Sales reports</h1>
        <button type="button" className="btn btn-outline no-print" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="toolbar no-print">
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
          <option value="custom">Custom dates</option>
        </select>
        {period === 'custom' && (
          <>
            From <input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
            To <input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          </>
        )}
      </div>
      {invalid && <p className="alert alert-error">The start date must be before the end date.</p>}
      {summary.error && <ErrorBox error={summary.error} onRetry={summary.reload} />}

      {s && (
        <div className="stats">
          <div className="card stat">
            <div className="muted">Revenue</div>
            <div className="value">{formatMoney(s.revenueCents)}</div>
          </div>
          <div className="card stat">
            <div className="muted">Orders</div>
            <div className="value">{s.orders}</div>
          </div>
          <div className="card stat">
            <div className="muted">Items sold</div>
            <div className="value">{s.units}</div>
          </div>
          <div className="card stat">
            <div className="muted">Refunds</div>
            <div className="value">{s.refunds}</div>
            <div className="small">{formatMoney(s.refundedCents)}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="page-head">
          <h3>Best-selling products</h3>
          <div className="toolbar no-print">
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="all">All categories</option>
              {meta.genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
            </select>
            <button type="button" className="btn btn-sm btn-outline" onClick={exportBest} disabled={rows.length === 0}>
              CSV
            </button>
          </div>
        </div>
        {best.loading && !best.data ? (
          <Loading />
        ) : rows.length === 0 ? (
          <p className="muted">Nothing was sold in this period.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Category</th>
                <th>Sold</th>
                <th>Revenue</th>
                <th>Stock left</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.title}</td>
                  <td>{r.genre}</td>
                  <td>{r.units}</td>
                  <td>{formatMoney(r.revenueCents)}</td>
                  <td className={r.stock === 0 ? 'error-text' : ''}>{r.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 15 }}>
        <div className="page-head">
          <h3>Daily revenue</h3>
          <button type="button" className="btn btn-sm btn-outline no-print" onClick={exportDaily}>
            CSV
          </button>
        </div>
        {daily.data ? (
          <LineChart data={daily.data.days.map((d) => ({ label: d.day, value: d.revenueCents / 100 }))} format={(v) => `$${Math.round(v)}`} />
        ) : (
          <Loading />
        )}
      </div>

      <div className="two-cols">
        <div className="card">
          <h3>Revenue by category</h3>
          <BarChart data={(genres.data?.rows ?? []).map((r) => ({ label: r.genre, value: r.revenueCents / 100 }))} format={(v) => `$${Math.round(v)}`} />
        </div>
        <div className="card">
          <h3>Top customers</h3>
          <table className="table">
            <tbody>
              {(customers.data?.rows ?? []).map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.name}
                    <div className="muted small">{c.orders} orders</div>
                  </td>
                  <td>{formatMoney(c.spentCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
