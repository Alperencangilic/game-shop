import { Router } from 'express';
import { audit, notifyWishlisters } from '../../activity.js';
import { db } from '../../db.js';
import { publish } from '../../events.js';
import { HttpError } from '../../errors.js';
import { getGame, queryGames } from '../../games.js';
import { requirePermission } from '../../middleware/auth.js';
import { formatCents } from '../../money.js';
import * as v from '../../validation.js';

// Catalog management (managers and admins)
export const adminGamesRouter = Router();
adminGamesRouter.use(requirePermission('games.manage'));

adminGamesRouter.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT oi.game_id, SUM(oi.paid_cents) AS revenue FROM order_items oi
       JOIN orders o ON o.id = oi.order_id WHERE o.status = 'paid' GROUP BY oi.game_id`
    )
    .all();
  const revenue = new Map(rows.map((r) => [r.game_id, r.revenue]));
  res.json({ games: queryGames({ includeHidden: true }).map((g) => ({ ...g, revenueCents: revenue.get(g.id) ?? 0 })) });
});

function runWrite(sql, fields) {
  try {
    return db.prepare(sql).run(fields);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new HttpError(409, `A product called "${fields.title}" already exists.`);
    throw err;
  }
}

adminGamesRouter.post('/', (req, res) => {
  const fields = v.parseGameFields(req.body);
  const cols = Object.keys(fields);
  const result = runWrite(`INSERT INTO games (${cols.join(', ')}) VALUES (${cols.map((c) => `@${c}`).join(', ')})`, fields);
  const game = getGame(Number(result.lastInsertRowid), { includeHidden: true });
  audit(req.user, 'game.create', `Added ${game.title} (${formatCents(game.priceCents)}, ${game.stock} keys)`);
  publish({ type: 'catalog-changed' });
  res.status(201).json({ game, message: `${game.title} was added.` });
});

// PUT = full edit form, PATCH = quick change (price, stock, visibility)
function updateGame(req, res, partial) {
  const id = v.id(req.params.id, 'Game');
  const before = getGame(id, { includeHidden: true });
  if (!before) throw new HttpError(404, 'This product no longer exists.');

  const fields = v.parseGameFields(req.body, { partial });
  if (Object.keys(fields).length === 0) throw new HttpError(400, 'Nothing to update.');
  fields.updated_at = new Date().toISOString();
  runWrite(`UPDATE games SET ${Object.keys(fields).map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`, { ...fields, id });
  const game = getGame(id, { includeHidden: true });

  const changes = [];
  if (before.priceCents !== game.priceCents) changes.push(`price ${formatCents(before.priceCents)} -> ${formatCents(game.priceCents)}`);
  if (before.stock !== game.stock) changes.push(`stock ${before.stock} -> ${game.stock}`);
  if (before.isActive !== game.isActive) changes.push(game.isActive ? 'shown' : 'hidden');
  audit(req.user, 'game.update', `${game.title}: ${changes.join(', ') || 'details edited'}`);

  if (before.stock === 0 && game.stock > 0) notifyWishlisters([id], (title) => `${title} from your wishlist is back in stock.`, 'info');
  if (before.priceCents > game.priceCents) notifyWishlisters([id], (title) => `Price drop: ${title} is now ${formatCents(game.finalPriceCents)}.`);
  publish({ type: before.isActive !== game.isActive ? 'catalog-changed' : 'game-updated', gameId: id, stock: game.stock });
  res.json({ game, message: `${game.title} was updated.` });
}

adminGamesRouter.put('/:id', (req, res) => updateGame(req, res, false));
adminGamesRouter.patch('/:id', (req, res) => updateGame(req, res, true));

// Change many prices by a percentage, e.g. -10
adminGamesRouter.post('/bulk-price', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? [...new Set(req.body.ids.map((x) => v.id(x, 'Game')))] : [];
  if (ids.length === 0) throw new HttpError(400, 'Select at least one product first.');
  const percent = v.integer(req.body.percent, 'Change', -90, 200);
  if (percent === 0) throw new HttpError(400, 'Enter a change other than 0%.');

  const result = db
    .prepare(
      `UPDATE games SET price_cents = MIN(99999, MAX(0, CAST(ROUND(price_cents * (100 + ?) / 100.0) AS INTEGER))), updated_at = ?
       WHERE id IN (${ids.map(() => '?').join(', ')})`
    )
    .run(percent, new Date().toISOString(), ...ids);
  audit(req.user, 'game.bulk-price', `${percent > 0 ? '+' : ''}${percent}% on ${result.changes} products`);
  if (percent < 0) notifyWishlisters(ids, (title) => `Price drop: ${title} is now ${Math.abs(percent)}% cheaper.`);
  publish({ type: 'catalog-changed' });
  res.json({ updated: result.changes, message: `Prices changed by ${percent}% for ${result.changes} products.` });
});

adminGamesRouter.delete('/:id', (req, res) => {
  const id = v.id(req.params.id, 'Game');
  const game = getGame(id, { includeHidden: true });
  if (!game) throw new HttpError(404, 'This product no longer exists.');

  // Sold products must stay for the buyers and the reports
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM order_items WHERE game_id = ?').get(id);
  if (n > 0) {
    throw new HttpError(409, `${game.title} was sold ${n} time${n > 1 ? 's' : ''}, so it cannot be deleted. Hide it from the store instead.`, {
      code: 'HAS_SALES',
    });
  }
  db.prepare('DELETE FROM games WHERE id = ?').run(id);
  audit(req.user, 'game.delete', `Deleted ${game.title}`);
  publish({ type: 'catalog-changed' });
  res.json({ message: `${game.title} was deleted.` });
});
