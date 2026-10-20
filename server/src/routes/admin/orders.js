import { Router } from 'express';
import { audit, notifyUser } from '../../activity.js';
import { db } from '../../db.js';
import { publish, publishToUser } from '../../events.js';
import { HttpError } from '../../errors.js';
import { requirePermission } from '../../middleware/auth.js';
import { formatCents } from '../../money.js';
import * as v from '../../validation.js';
import { loadOrders } from '../shop.js';

// Orders (staff), refunds (admins only)
export const adminOrdersRouter = Router();

adminOrdersRouter.get('/', requirePermission('orders.view'), (req, res) => {
  const clauses = ['1 = 1'];
  const params = {};
  if (req.query.status === 'paid' || req.query.status === 'refunded') {
    clauses.push('o.status = @status');
    params.status = req.query.status;
  }
  if (req.query.search) {
    clauses.push(
      '(u.name LIKE @search OR u.email LIKE @search OR CAST(o.id AS TEXT) = @exact OR EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.title LIKE @search))'
    );
    params.search = `%${String(req.query.search).trim()}%`;
    params.exact = String(req.query.search).trim().replace(/^#/, '');
  }
  res.json({ orders: loadOrders(clauses.join(' AND '), params) });
});

// Refund: money back, keys removed from library and put back in stock
const refund = db.transaction((orderId) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new HttpError(404, 'This order does not exist.');
  if (order.status === 'refunded') throw new HttpError(409, `Order #${orderId} was already refunded.`);

  const items = db.prepare('SELECT game_id FROM order_items WHERE order_id = ?').all(orderId);
  const now = new Date().toISOString();
  db.prepare("UPDATE orders SET status = 'refunded', refunded_at = ? WHERE id = ?").run(now, orderId);
  db.prepare('DELETE FROM library WHERE order_id = ?').run(orderId);
  for (const item of items) db.prepare('UPDATE games SET stock = stock + 1 WHERE id = ?').run(item.game_id);
  db.prepare('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?').run(order.total_cents, order.user_id);
  db.prepare("INSERT INTO wallet_transactions (user_id, amount_cents, type, note, order_id) VALUES (?, ?, 'refund', ?, ?)").run(
    order.user_id,
    order.total_cents,
    `Refund for order #${orderId}`,
    orderId
  );
  return { order, gameIds: items.map((i) => i.game_id) };
});

adminOrdersRouter.post('/:id/refund', requirePermission('orders.refund'), (req, res) => {
  const orderId = v.id(req.params.id, 'Order');
  const { order, gameIds } = refund(orderId);

  audit(req.user, 'order.refund', `Refunded order #${orderId} (${formatCents(order.total_cents)})`);
  notifyUser(order.user_id, `Order #${orderId} was refunded. ${formatCents(order.total_cents)} is back in your wallet.`, {
    kind: 'warning',
    link: '/orders',
  });
  publishToUser(order.user_id, { type: 'account-changed' });
  publish({ type: 'orders-changed' });
  for (const gameId of gameIds) {
    const { stock } = db.prepare('SELECT stock FROM games WHERE id = ?').get(gameId);
    publish({ type: 'game-updated', gameId, stock });
  }
  res.json({ message: `Order #${orderId} refunded. ${formatCents(order.total_cents)} returned to the customer's wallet.` });
});
