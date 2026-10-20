import { Router } from 'express';
import { audit, notifyUser } from '../activity.js';
import { db } from '../db.js';
import { publish, publishToUser } from '../events.js';
import { HttpError } from '../errors.js';
import { getGame, queryGames } from '../games.js';
import { generateLicenseKey } from '../license.js';
import { requirePermission } from '../middleware/auth.js';
import { formatCents } from '../money.js';
import * as v from '../validation.js';

// Cart, wishlist, checkout, orders (customers only)
export const shopRouter = Router();
shopRouter.use(['/shop', '/cart', '/wishlist', '/checkout', '/orders'], requirePermission('store.purchase'));

shopRouter.get('/shop/state', (req, res) => {
  const ids = (sql) => db.prepare(sql).all(req.user.id).map((r) => r.game_id);
  res.json({
    cart: ids('SELECT game_id FROM cart_items WHERE user_id = ? ORDER BY added_at'),
    wishlist: ids('SELECT game_id FROM wishlist WHERE user_id = ?'),
    owned: ids('SELECT DISTINCT game_id FROM library WHERE user_id = ?'),
  });
});


// Why a product can't be bought right now (null = ok). E-pins can be bought again.
function purchaseProblem(game) {
  if (!game.isActive) return 'This product is no longer sold. Remove it from your cart.';
  if (game.owned && game.type === 'game') return 'You already own this game.';
  if (game.stock <= 0) return 'Sold out. Move it to your wishlist to hear when it is back.';
  return null;
}

shopRouter.get('/cart', (req, res) => {
  const items = queryGames({ userId: req.user.id, includeHidden: true, where: 'g.id IN (SELECT game_id FROM cart_items WHERE user_id = @userId)' }).map(
    (game) => ({ ...game, problem: purchaseProblem(game) })
  );
  const ok = items.filter((item) => !item.problem);
  res.json({
    items,
    summary: {
      subtotalCents: ok.reduce((s, g) => s + g.priceCents, 0),
      discountCents: ok.reduce((s, g) => s + (g.priceCents - g.finalPriceCents), 0),
      totalCents: ok.reduce((s, g) => s + g.finalPriceCents, 0),
      balanceCents: req.user.balance_cents,
    },
  });
});

shopRouter.post('/cart', (req, res) => {
  const game = getGame(v.id(req.body.gameId, 'Game'), { userId: req.user.id });
  if (!game) throw new HttpError(404, 'This product does not exist or is no longer sold.');
  if (game.owned && game.type === 'game') throw new HttpError(409, `${game.title} is already in your library.`);
  if (game.inCart) throw new HttpError(409, `${game.title} is already in your cart.`);
  if (game.stock <= 0) throw new HttpError(409, `${game.title} is sold out. Add it to your wishlist and we will tell you when it is back.`);
  db.prepare('INSERT INTO cart_items (user_id, game_id) VALUES (?, ?)').run(req.user.id, game.id);
  res.status(201).json({ ok: true });
});

shopRouter.delete('/cart/:gameId', (req, res) => {
  const result = db.prepare('DELETE FROM cart_items WHERE user_id = ? AND game_id = ?').run(req.user.id, v.id(req.params.gameId, 'Game'));
  if (result.changes === 0) throw new HttpError(404, 'That product is not in your cart.');
  res.json({ ok: true });
});

shopRouter.delete('/cart', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});


shopRouter.get('/wishlist', (req, res) => {
  res.json({ games: queryGames({ userId: req.user.id, where: 'g.id IN (SELECT game_id FROM wishlist WHERE user_id = @userId)' }) });
});

shopRouter.post('/wishlist', (req, res) => {
  const game = getGame(v.id(req.body.gameId, 'Game'), { userId: req.user.id });
  if (!game) throw new HttpError(404, 'This product does not exist or is no longer sold.');
  if (game.owned && game.type === 'game') throw new HttpError(409, `You already own ${game.title}.`);
  db.prepare('INSERT OR IGNORE INTO wishlist (user_id, game_id) VALUES (?, ?)').run(req.user.id, game.id);
  res.status(201).json({ ok: true });
});

shopRouter.delete('/wishlist/:gameId', (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE user_id = ? AND game_id = ?').run(req.user.id, v.id(req.params.gameId, 'Game'));
  res.json({ ok: true });
});


const checkout = db.transaction((user, gameIds, expectedTotalCents) => {
  const placeholders = gameIds.map((_, i) => `@g${i}`).join(', ');
  const params = Object.fromEntries(gameIds.map((id, i) => [`g${i}`, id]));
  const games = queryGames({ userId: user.id, includeHidden: true, where: `g.id IN (${placeholders})`, params });
  if (games.length !== gameIds.length) throw new HttpError(404, 'One of the products no longer exists. Refresh your cart.');

  for (const game of games) {
    const problem = purchaseProblem(game);
    if (problem) throw new HttpError(409, `${game.title}: ${problem}`);
  }

  const total = games.reduce((sum, g) => sum + g.finalPriceCents, 0);
  if (expectedTotalCents !== undefined && expectedTotalCents !== total) {
    throw new HttpError(409, `Prices changed while you were shopping. The new total is ${formatCents(total)}. Check your cart and try again.`, {
      code: 'PRICE_CHANGED',
    });
  }

  const balance = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(user.id).balance_cents;
  if (balance < total) {
    throw new HttpError(402, `Not enough wallet balance. You need ${formatCents(total - balance)} more.`, { code: 'INSUFFICIENT_FUNDS' });
  }

  const orderId = Number(db.prepare('INSERT INTO orders (user_id, total_cents) VALUES (?, ?)').run(user.id, total).lastInsertRowid);
  const entries = [];
  for (const game of games) {
    // only take a key if one is left
    const taken = db.prepare('UPDATE games SET stock = stock - 1 WHERE id = ? AND stock > 0').run(game.id);
    if (taken.changes === 0) throw new HttpError(409, `${game.title} just sold out.`);
    db.prepare(
      'INSERT INTO order_items (order_id, game_id, title, unit_price_cents, discount_percent, paid_cents) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(orderId, game.id, game.title, game.priceCents, game.discountPercent, game.finalPriceCents);
    const key = generateLicenseKey();
    const entry = db.prepare('INSERT INTO library (user_id, game_id, order_id, license_key) VALUES (?, ?, ?, ?)').run(user.id, game.id, orderId, key);
    entries.push({ entryId: Number(entry.lastInsertRowid), id: game.id, title: game.title, type: game.type, imageUrl: game.imageUrl, licenseKey: key });
  }

  db.prepare('UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?').run(total, user.id);
  db.prepare("INSERT INTO wallet_transactions (user_id, amount_cents, type, note, order_id) VALUES (?, ?, 'purchase', ?, ?)").run(
    user.id,
    -total,
    `Order #${orderId}`,
    orderId
  );
  db.prepare(`DELETE FROM cart_items WHERE user_id = @userId AND game_id IN (${placeholders})`).run({ userId: user.id, ...params });
  db.prepare(`DELETE FROM wishlist WHERE user_id = @userId AND game_id IN (${placeholders})`).run({ userId: user.id, ...params });
  return { orderId, total, games, entries };
});

// Body: { gameIds?, expectedTotalCents? }. Without gameIds the whole cart is bought.
shopRouter.post('/checkout', (req, res) => {
  let gameIds;
  if (Array.isArray(req.body.gameIds)) gameIds = [...new Set(req.body.gameIds.map((id) => v.id(id, 'Game')))];
  else gameIds = db.prepare('SELECT game_id FROM cart_items WHERE user_id = ?').all(req.user.id).map((r) => r.game_id);
  if (gameIds.length === 0) throw new HttpError(400, 'Your cart is empty. Add a product before checking out.');
  if (gameIds.length > 20) throw new HttpError(400, 'You can buy at most 20 products in one order.');

  const expected = req.body.expectedTotalCents === undefined ? undefined : v.integer(req.body.expectedTotalCents, 'Total', 0, 1e9);
  const { orderId, total, games, entries } = checkout(req.user, gameIds, expected);

  for (const game of games) publish({ type: 'game-updated', gameId: game.id, stock: game.stock - 1 });
  publish({ type: 'orders-changed' });
  publishToUser(req.user.id, { type: 'account-changed' });
  notifyUser(req.user.id, `Order #${orderId} confirmed: ${games.map((g) => g.title).join(', ')}.`, { kind: 'success', link: '/library' });
  audit(req.user, 'order.create', `Order #${orderId} (${formatCents(total)})`);

  res.status(201).json({ order: { id: orderId, totalCents: total, entries }, message: `Order #${orderId} confirmed.` });
});


export function loadOrders(where, params = {}) {
  const statement = db.prepare(
    `SELECT o.id, o.user_id, u.name AS user_name, u.email AS user_email, o.total_cents, o.status, o.created_at, o.refunded_at
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE ${where} ORDER BY o.created_at DESC LIMIT 500`
  );
  const orders = Object.keys(params).length > 0 ? statement.all(params) : statement.all();
  if (orders.length === 0) return [];

  const items = db
    .prepare(
      `SELECT oi.order_id, oi.game_id, oi.title, oi.unit_price_cents, oi.discount_percent, oi.paid_cents, g.image_url, g.genre
       FROM order_items oi JOIN games g ON g.id = oi.game_id
       WHERE oi.order_id IN (${orders.map((o) => o.id).join(',')})`
    )
    .all();

  return orders.map((o) => ({
    id: o.id,
    userId: o.user_id,
    userName: o.user_name,
    userEmail: o.user_email,
    totalCents: o.total_cents,
    status: o.status,
    createdAt: o.created_at,
    refundedAt: o.refunded_at,
    items: items
      .filter((i) => i.order_id === o.id)
      .map((i) => ({
        gameId: i.game_id,
        title: i.title,
        genre: i.genre,
        imageUrl: i.image_url,
        unitPriceCents: i.unit_price_cents,
        discountPercent: i.discount_percent,
        paidCents: i.paid_cents,
      })),
  }));
}

shopRouter.get('/orders', (req, res) => {
  res.json({ orders: loadOrders('o.user_id = @userId', { userId: req.user.id }) });
});
