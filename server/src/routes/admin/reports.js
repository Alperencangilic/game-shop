import { Router } from 'express';
import { GENRES, LOW_STOCK_LIMIT } from '../../constants.js';
import { db } from '../../db.js';
import { HttpError } from '../../errors.js';
import { requirePermission } from '../../middleware/auth.js';
import * as v from '../../validation.js';

// Sales reports. Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD
export const adminReportsRouter = Router();
adminReportsRouter.use(requirePermission('reports.view'));

const IN_RANGE = "date(o.created_at, 'localtime') BETWEEN @from AND @to";

function range(query) {
  const from = query.from ? v.day(query.from, 'From date') : '0001-01-01';
  const to = query.to ? v.day(query.to, 'To date') : '9999-12-31';
  if (from > to) throw new HttpError(400, 'The start date must be before the end date.');
  return { from, to };
}

adminReportsRouter.get('/summary', (req, res) => {
  const r = range(req.query);
  const sales = db
    .prepare(
      `SELECT
         COUNT(*) AS orders,
         COALESCE(SUM(o.total_cents), 0) AS revenue,
         COUNT(DISTINCT o.user_id) AS buyers,
         (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status = 'paid' AND ${IN_RANGE}) AS units
       FROM orders o WHERE o.status = 'paid' AND ${IN_RANGE}`
    )
    .get(r);
  const refunds = db
    .prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(o.total_cents), 0) AS cents FROM orders o WHERE o.status = 'refunded' AND ${IN_RANGE}`)
    .get(r);
  const customers = db
    .prepare(
      `SELECT COUNT(*) AS total,
         SUM(CASE WHEN date(created_at, 'localtime') BETWEEN @from AND @to THEN 1 ELSE 0 END) AS new_in_range
       FROM users WHERE role = 'customer'`
    )
    .get(r);
  const catalog = db
    .prepare(
      `SELECT COUNT(*) AS games,
         SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS hidden,
         SUM(CASE WHEN is_active = 1 AND stock = 0 THEN 1 ELSE 0 END) AS out_of_stock,
         SUM(CASE WHEN is_active = 1 AND stock BETWEEN 1 AND @low THEN 1 ELSE 0 END) AS low_stock,
         COALESCE(SUM(stock), 0) AS keys_in_stock
       FROM games`
    )
    .get({ low: LOW_STOCK_LIMIT });

  res.json({
    summary: {
      revenueCents: sales.revenue,
      orders: sales.orders,
      units: sales.units,
      averageOrderCents: sales.orders ? Math.round(sales.revenue / sales.orders) : 0,
      buyers: sales.buyers,
      refunds: refunds.n,
      refundedCents: refunds.cents,
      customers: customers.total,
      newCustomers: customers.new_in_range ?? 0,
      games: catalog.games,
      hiddenGames: catalog.hidden ?? 0,
      outOfStock: catalog.out_of_stock ?? 0,
      lowStock: catalog.low_stock ?? 0,
      keysInStock: catalog.keys_in_stock,
    },
  });
});

adminReportsRouter.get('/best-sellers', (req, res) => {
  const r = range(req.query);
  const limit = v.integer(req.query.limit ?? 10, 'Limit', 1, 100);
  const genre = req.query.genre && req.query.genre !== 'all' ? v.oneOf(req.query.genre, GENRES, 'Genre') : null;

  const rows = db
    .prepare(
      `SELECT g.id, g.title, g.genre, g.type, g.image_url, g.stock, g.price_cents,
         COUNT(oi.id) AS units, COALESCE(SUM(oi.paid_cents), 0) AS revenue
       FROM games g
       JOIN order_items oi ON oi.game_id = g.id
       JOIN orders o ON o.id = oi.order_id AND o.status = 'paid' AND ${IN_RANGE}
       WHERE (@genre IS NULL OR g.genre = @genre)
       GROUP BY g.id
       ORDER BY units DESC, revenue DESC, g.title
       LIMIT @limit`
    )
    .all({ ...r, genre, limit })
    .map((row) => ({
      id: row.id,
      title: row.title,
      genre: row.genre,
      type: row.type,
      imageUrl: row.image_url,
      stock: row.stock,
      priceCents: row.price_cents,
      units: row.units,
      revenueCents: row.revenue,
    }));
  res.json({ rows });
});

// Days without sales are filled with 0
adminReportsRouter.get('/sales-by-day', (req, res) => {
  const r = range(req.query);
  const rows = db
    .prepare(
      `SELECT date(o.created_at, 'localtime') AS day, COUNT(*) AS orders, SUM(o.total_cents) AS revenue,
         (SELECT COUNT(*) FROM order_items oi JOIN orders x ON x.id = oi.order_id
            WHERE x.status = 'paid' AND date(x.created_at, 'localtime') = date(o.created_at, 'localtime')) AS units
       FROM orders o
       WHERE o.status = 'paid' AND ${IN_RANGE}
       GROUP BY day ORDER BY day`
    )
    .all(r);

  const byDay = new Map(rows.map((row) => [row.day, row]));
  const first = r.from !== '0001-01-01' ? r.from : rows[0]?.day;
  const last = r.to !== '9999-12-31' ? r.to : localDay(new Date());
  const days = [];
  if (first) {
    const cursor = new Date(`${first}T12:00:00`);
    const end = new Date(`${last}T12:00:00`);
    while (cursor <= end && days.length < 400) {
      const key = localDay(cursor);
      const row = byDay.get(key);
      days.push({ day: key, orders: row?.orders ?? 0, revenueCents: row?.revenue ?? 0, units: row?.units ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  res.json({ days });
});

function localDay(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

adminReportsRouter.get('/revenue-by-genre', (req, res) => {
  const r = range(req.query);
  const rows = db
    .prepare(
      `SELECT g.genre, COUNT(oi.id) AS units, COALESCE(SUM(oi.paid_cents), 0) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id AND o.status = 'paid' AND ${IN_RANGE}
       JOIN games g ON g.id = oi.game_id
       GROUP BY g.genre ORDER BY revenue DESC`
    )
    .all(r)
    .map((row) => ({ genre: row.genre, units: row.units, revenueCents: row.revenue }));
  res.json({ rows });
});

adminReportsRouter.get('/top-customers', (req, res) => {
  const r = range(req.query);
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, COUNT(o.id) AS orders, SUM(o.total_cents) AS spent
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.status = 'paid' AND ${IN_RANGE}
       GROUP BY u.id ORDER BY spent DESC LIMIT 5`
    )
    .all(r)
    .map((row) => ({ id: row.id, name: row.name, email: row.email, orders: row.orders, spentCents: row.spent }));
  res.json({ rows });
});

adminReportsRouter.get('/low-stock', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, title, genre, stock, image_url FROM games
       WHERE is_active = 1 AND stock <= ? ORDER BY stock, title`
    )
    .all(LOW_STOCK_LIMIT)
    .map((row) => ({ id: row.id, title: row.title, genre: row.genre, stock: row.stock, imageUrl: row.image_url }));
  res.json({ rows, limit: LOW_STOCK_LIMIT });
});
