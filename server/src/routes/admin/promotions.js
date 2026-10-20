import { Router } from 'express';
import { audit, notifyWishlisters } from '../../activity.js';
import { GENRES } from '../../constants.js';
import { db } from '../../db.js';
import { publish } from '../../events.js';
import { HttpError } from '../../errors.js';
import { requirePermission } from '../../middleware/auth.js';
import * as v from '../../validation.js';

// Promotions: whole store, one genre or one game. Biggest discount wins.
export const adminPromotionsRouter = Router();
adminPromotionsRouter.use(requirePermission('promotions.manage'));

function statusOf(row, now) {
  if (row.starts_at > now) return 'scheduled';
  if (row.ends_at <= now) return 'ended';
  return 'live';
}

adminPromotionsRouter.get('/', (req, res) => {
  const now = new Date().toISOString();
  const promotions = db
    .prepare(
      `SELECT p.*, g.title AS game_title, u.name AS created_by_name,
         (SELECT COUNT(*) FROM games x WHERE x.is_active = 1 AND
            (x.id = p.game_id OR x.genre = p.genre OR (p.game_id IS NULL AND p.genre IS NULL))) AS game_count
       FROM promotions p
       LEFT JOIN games g ON g.id = p.game_id
       LEFT JOIN users u ON u.id = p.created_by
       ORDER BY p.ends_at DESC, p.id DESC`
    )
    .all()
    .map((row) => ({
      id: row.id,
      name: row.name,
      target: row.game_id ? 'game' : row.genre ? 'genre' : 'store',
      gameId: row.game_id,
      gameTitle: row.game_title,
      genre: row.genre,
      discountPercent: row.discount_percent,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: statusOf(row, now),
      gameCount: row.game_count,
      createdBy: row.created_by_name,
    }));
  res.json({ promotions });
});

function parsePromotion(body) {
  const name = v.text(body.name, 'Name', 60, { min: 3 });
  const target = v.oneOf(body.target, ['store', 'genre', 'game'], 'Target');
  const discount = v.integer(body.discountPercent, 'Discount', 1, 90);
  const startsAt = v.isoDate(body.startsAt, 'Start');
  const endsAt = v.isoDate(body.endsAt, 'End');
  if (endsAt <= startsAt) throw new HttpError(400, 'The promotion must end after it starts.');
  if (endsAt <= new Date().toISOString()) throw new HttpError(400, 'The end date is in the past. Pick a future end date.');

  let gameId = null;
  let genre = null;
  if (target === 'game') {
    gameId = v.id(body.gameId, 'Game');
    if (!db.prepare('SELECT 1 FROM games WHERE id = ?').get(gameId)) throw new HttpError(404, 'The selected game does not exist.');
  } else if (target === 'genre') {
    genre = v.oneOf(body.genre, GENRES, 'Genre');
  }
  return { name, gameId, genre, discount, startsAt, endsAt };
}

// Notify wishlist owners if the promotion is already live
function announce(p) {
  const now = new Date().toISOString();
  if (p.startsAt > now) return;
  const ids = db
    .prepare('SELECT id FROM games WHERE is_active = 1 AND (id = ? OR genre = ? OR (? IS NULL AND ? IS NULL))')
    .all(p.gameId, p.genre, p.gameId, p.genre)
    .map((r) => r.id);
  notifyWishlisters(ids, (title) => `${title} from your wishlist is ${p.discount}% off: ${p.name}.`);
}

adminPromotionsRouter.post('/', (req, res) => {
  const p = parsePromotion(req.body);
  const result = db
    .prepare('INSERT INTO promotions (name, game_id, genre, discount_percent, starts_at, ends_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(p.name, p.gameId, p.genre, p.discount, p.startsAt, p.endsAt, req.user.id);
  audit(req.user, 'promotion.create', `${p.name}: ${p.discount}% off`);
  announce(p);
  publish({ type: 'catalog-changed' });
  res.status(201).json({ id: Number(result.lastInsertRowid), message: `Promotion "${p.name}" created.` });
});

adminPromotionsRouter.put('/:id', (req, res) => {
  const id = v.id(req.params.id, 'Promotion');
  const p = parsePromotion(req.body);
  const result = db
    .prepare('UPDATE promotions SET name = ?, game_id = ?, genre = ?, discount_percent = ?, starts_at = ?, ends_at = ? WHERE id = ?')
    .run(p.name, p.gameId, p.genre, p.discount, p.startsAt, p.endsAt, id);
  if (result.changes === 0) throw new HttpError(404, 'This promotion no longer exists.');
  audit(req.user, 'promotion.update', `${p.name}: ${p.discount}% off`);
  publish({ type: 'catalog-changed' });
  res.json({ message: `Promotion "${p.name}" saved.` });
});

adminPromotionsRouter.post('/:id/end', (req, res) => {
  const id = v.id(req.params.id, 'Promotion');
  const now = new Date().toISOString();
  const promo = db.prepare('SELECT name, starts_at, ends_at FROM promotions WHERE id = ?').get(id);
  if (!promo) throw new HttpError(404, 'This promotion no longer exists.');
  if (promo.ends_at <= now) throw new HttpError(409, 'This promotion has already ended.');
  if (promo.starts_at > now) throw new HttpError(409, 'This promotion has not started yet. Delete it instead.');

  db.prepare('UPDATE promotions SET ends_at = ? WHERE id = ?').run(now, id);
  audit(req.user, 'promotion.end', promo.name);
  publish({ type: 'catalog-changed' });
  res.json({ message: `"${promo.name}" ended. Prices are back to normal.` });
});

adminPromotionsRouter.delete('/:id', (req, res) => {
  const id = v.id(req.params.id, 'Promotion');
  const promo = db.prepare('SELECT name FROM promotions WHERE id = ?').get(id);
  if (!promo) throw new HttpError(404, 'This promotion no longer exists.');
  db.prepare('DELETE FROM promotions WHERE id = ?').run(id);
  audit(req.user, 'promotion.delete', promo.name);
  publish({ type: 'catalog-changed' });
  res.json({ message: `Promotion "${promo.name}" deleted.` });
});
