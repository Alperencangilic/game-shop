import { Router } from 'express';
import { audit } from '../activity.js';
import { AGE_RATINGS, GENRES, LOW_STOCK_LIMIT, MAX_BALANCE_CENTS, PLATFORMS, TOP_UP_AMOUNTS } from '../constants.js';
import { db } from '../db.js';
import { HttpError } from '../errors.js';
import { SORTS, getGame, queryGames } from '../games.js';
import { requirePermission, requireUser } from '../middleware/auth.js';
import { ROLES, ROLE_LABELS, hasPermission } from '../permissions.js';
import * as v from '../validation.js';

export const gamesRouter = Router();

const viewerId = (req) => req.user?.id ?? null;

gamesRouter.get('/meta', (req, res) => {
  res.json({
    genres: GENRES,
    platforms: PLATFORMS,
    ageRatings: AGE_RATINGS,
    roles: ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
    topUpAmounts: TOP_UP_AMOUNTS,
    maxBalanceCents: MAX_BALANCE_CENTS,
    lowStockLimit: LOW_STOCK_LIMIT,
  });
});

gamesRouter.get('/games', (req, res) => {
  const { genre, search, sort } = req.query;
  const clauses = [];
  const params = {};
  if (genre && genre !== 'all') {
    clauses.push('g.genre = @genre');
    params.genre = String(genre);
  }
  if (search) {
    clauses.push('(g.title LIKE @search OR g.developer LIKE @search)');
    params.search = `%${String(search).trim()}%`;
  }
  const games = queryGames({ userId: viewerId(req), where: clauses.join(' AND '), params, orderBy: SORTS[sort] ?? SORTS.title });
  res.json({ games });
});

gamesRouter.get('/genres', (req, res) => {
  res.json({ genres: db.prepare('SELECT genre, COUNT(*) AS count FROM games WHERE is_active = 1 GROUP BY genre ORDER BY genre').all() });
});

gamesRouter.get('/games/:id', (req, res) => {
  const includeHidden = hasPermission(req.user, 'games.manage');
  const game = getGame(v.id(req.params.id, 'Game'), { userId: viewerId(req), includeHidden });
  if (!game) throw new HttpError(404, 'This game does not exist or is no longer sold.');
  res.json({ game });
});

gamesRouter.get('/games/:id/similar', (req, res) => {
  const game = getGame(v.id(req.params.id, 'Game'));
  if (!game) return res.json({ games: [] });
  const games = queryGames({
    userId: viewerId(req),
    where: 'g.id <> @id AND (g.genre = @genre OR g.developer = @developer)',
    params: { id: game.id, genre: game.genre, developer: game.developer },
    orderBy: `CASE WHEN g.genre = @genre THEN 0 ELSE 1 END, ${SORTS.popular}`,
  }).slice(0, 4);
  res.json({ games });
});


gamesRouter.get('/games/:id/reviews', (req, res) => {
  const reviews = db
    .prepare(
      `SELECT r.id, r.user_id, u.name AS user_name, r.rating, r.comment, r.created_at, r.updated_at
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.game_id = ? ORDER BY r.updated_at DESC`
    )
    .all(v.id(req.params.id, 'Game'))
    .map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      edited: r.updated_at !== r.created_at,
    }));

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) distribution[r.rating]++;
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  res.json({ reviews, summary: { count: reviews.length, average, distribution } });
});

gamesRouter.post('/games/:id/reviews', requirePermission('store.purchase'), (req, res) => {
  const gameId = v.id(req.params.id, 'Game');
  const rating = v.integer(req.body.rating, 'Rating', 1, 5);
  const comment = v.text(req.body.comment, 'Review', 1000, { allowEmpty: true });

  if (!db.prepare('SELECT 1 FROM library WHERE user_id = ? AND game_id = ?').get(req.user.id, gameId)) {
    throw new HttpError(403, 'You can only review products you bought.');
  }
  if (db.prepare('SELECT 1 FROM reviews WHERE user_id = ? AND game_id = ?').get(req.user.id, gameId)) {
    throw new HttpError(409, 'You already reviewed this game. Edit your review instead.');
  }
  const result = db.prepare('INSERT INTO reviews (user_id, game_id, rating, comment) VALUES (?, ?, ?, ?)').run(req.user.id, gameId, rating, comment);
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

gamesRouter.put('/reviews/:id', requireUser, (req, res) => {
  const reviewId = v.id(req.params.id, 'Review');
  const rating = v.integer(req.body.rating, 'Rating', 1, 5);
  const comment = v.text(req.body.comment, 'Review', 1000, { allowEmpty: true });

  const review = db.prepare('SELECT user_id FROM reviews WHERE id = ?').get(reviewId);
  if (!review) throw new HttpError(404, 'Review not found. It may have been deleted.');
  if (review.user_id !== req.user.id) throw new HttpError(403, 'You can only edit your own reviews.');

  db.prepare('UPDATE reviews SET rating = ?, comment = ?, updated_at = ? WHERE id = ?').run(rating, comment, new Date().toISOString(), reviewId);
  res.json({ ok: true });
});

gamesRouter.delete('/reviews/:id', requireUser, (req, res) => {
  const reviewId = v.id(req.params.id, 'Review');
  const review = db.prepare('SELECT r.user_id, g.title FROM reviews r JOIN games g ON g.id = r.game_id WHERE r.id = ?').get(reviewId);
  if (!review) throw new HttpError(404, 'Review not found. It may have been deleted.');

  const own = review.user_id === req.user.id;
  if (!own && !hasPermission(req.user, 'reviews.moderate')) throw new HttpError(403, 'You can only delete your own reviews.');
  db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);
  if (!own) audit(req.user, 'review.delete', `Removed a review of ${review.title}`);
  res.json({ ok: true });
});
