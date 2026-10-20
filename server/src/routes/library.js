import { Router } from 'express';
import { db } from '../db.js';
import { HttpError } from '../errors.js';
import { SORTS, queryGames } from '../games.js';
import { requirePermission } from '../middleware/auth.js';
import * as v from '../validation.js';

// Library, downloads and recommendations (customers only)
export const libraryRouter = Router();
libraryRouter.use(['/library', '/downloads', '/recommendations'], requirePermission('store.purchase'));

// One item per bought key
libraryRouter.get('/library', (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.id, l.game_id, l.license_key, l.acquired_at, l.order_id,
         (SELECT COUNT(*) FROM downloads d WHERE d.library_id = l.id) AS download_count,
         (SELECT MAX(d.downloaded_at) FROM downloads d WHERE d.library_id = l.id) AS last_download,
         (SELECT r.rating FROM reviews r WHERE r.user_id = l.user_id AND r.game_id = l.game_id) AS my_rating
       FROM library l WHERE l.user_id = ? ORDER BY l.acquired_at DESC, l.id DESC`
    )
    .all(req.user.id);
  const games = new Map(
    queryGames({ userId: req.user.id, includeHidden: true, where: 'g.id IN (SELECT game_id FROM library WHERE user_id = @userId)' }).map((g) => [g.id, g])
  );
  const items = rows.map((row) => ({
    ...games.get(row.game_id),
    entryId: row.id,
    licenseKey: row.license_key,
    acquiredAt: row.acquired_at,
    orderId: row.order_id,
    downloadCount: row.download_count,
    lastDownloadAt: row.last_download,
    myRating: row.my_rating,
  }));
  res.json({ items });
});

// Simulated download: a text file with the license key / redeem code
libraryRouter.get('/library/:entryId/download', (req, res) => {
  const entry = db
    .prepare(
      `SELECT l.id, l.license_key, l.acquired_at, g.id AS game_id, g.title, g.type, g.developer, g.storage_gb
       FROM library l JOIN games g ON g.id = l.game_id WHERE l.id = ? AND l.user_id = ?`
    )
    .get(v.id(req.params.entryId, 'Item'), req.user.id);
  if (!entry) throw new HttpError(403, 'This item is not in your library.');

  const isGame = entry.type === 'game';
  const fileName = `${entry.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${isGame ? 'setup' : 'code'}.txt`;
  db.prepare('INSERT INTO downloads (user_id, game_id, library_id, file_name) VALUES (?, ?, ?, ?)').run(req.user.id, entry.game_id, entry.id, fileName);

  const lines = isGame
    ? [`${entry.title} - installer (demo file)`, '', `Developer:    ${entry.developer}`, `Install size: ${entry.storage_gb} GB`, `License key:  ${entry.license_key}`]
    : [`${entry.title} - redeem code`, '', `Code: ${entry.license_key}`, '', 'Redeem this code on the official website or in the game store.'];
  lines.push('', `Owner: ${req.user.name} <${req.user.email}>`, `Bought: ${entry.acquired_at}`, '', 'Game Shop - CENG 475 project (demo, not a real key)');
  res.attachment(fileName).type('text/plain').send(lines.join('\r\n'));
});

libraryRouter.get('/downloads', (req, res) => {
  const items = db
    .prepare(
      `SELECT d.id, d.file_name, d.downloaded_at, g.id AS game_id, g.title, g.genre, g.type, g.image_url, g.storage_gb
       FROM downloads d JOIN games g ON g.id = d.game_id
       WHERE d.user_id = ? ORDER BY d.downloaded_at DESC, d.id DESC LIMIT 500`
    )
    .all(req.user.id)
    .map((row) => ({
      id: row.id,
      gameId: row.game_id,
      title: row.title,
      genre: row.genre,
      type: row.type,
      imageUrl: row.image_url,
      sizeGb: row.storage_gb,
      fileName: row.file_name,
      downloadedAt: row.downloaded_at,
    }));
  res.json({ items });
});

libraryRouter.delete('/downloads/:id', (req, res) => {
  const result = db.prepare('DELETE FROM downloads WHERE id = ? AND user_id = ?').run(v.id(req.params.id, 'Download'), req.user.id);
  if (result.changes === 0) throw new HttpError(404, 'That entry was already removed.');
  res.json({ ok: true });
});

libraryRouter.delete('/downloads', (req, res) => {
  res.json({ ok: true, removed: db.prepare('DELETE FROM downloads WHERE user_id = ?').run(req.user.id).changes });
});

// Score = owned genres x3 + wishlist genre 2 + same developer 2 + rating/popularity
libraryRouter.get('/recommendations', (req, res) => {
  const userId = req.user.id;
  const owned = db.prepare('SELECT DISTINCT g.genre, g.developer, g.title FROM library l JOIN games g ON g.id = l.game_id WHERE l.user_id = ?').all(userId);
  const wishGenres = new Set(
    db.prepare('SELECT g.genre FROM wishlist w JOIN games g ON g.id = w.game_id WHERE w.user_id = ?').all(userId).map((r) => r.genre)
  );
  const genreCount = {};
  const developerTitle = {};
  for (const g of owned) {
    genreCount[g.genre] = (genreCount[g.genre] ?? 0) + 1;
    developerTitle[g.developer] ??= g.title;
  }

  const candidates = queryGames({
    userId,
    where: 'g.stock > 0 AND g.id NOT IN (SELECT game_id FROM library WHERE user_id = @userId)',
    orderBy: SORTS.popular,
  });
  const maxSales = Math.max(1, ...candidates.map((g) => g.sales));

  const scored = candidates.map((game) => {
    const signals = [];
    if (genreCount[game.genre]) {
      const reason = game.type === 'epin' ? 'You bought similar codes before' : `You like ${game.genre} games`;
      signals.push({ score: 3 * genreCount[game.genre], reason });
    }
    if (developerTitle[game.developer]) signals.push({ score: 2, reason: `Same developer as ${developerTitle[game.developer]}` });
    if (wishGenres.has(game.genre) && !game.wishlisted) signals.push({ score: 2, reason: `Similar to your wishlist` });
    signals.sort((a, b) => b.score - a.score);
    const score = signals.reduce((s, x) => s + x.score, 0) + (game.rating ?? 3) / 5 + game.sales / maxSales + (game.discountPercent ? 0.5 : 0);
    return { ...game, score, reason: signals[0]?.reason ?? (game.discountPercent ? `${game.discountPercent}% off` : 'Popular') };
  });
  scored.sort((a, b) => b.score - a.score);
  // max 2 codes, the rest are games
  const codes = scored.filter((g) => g.type === 'epin').slice(0, 2);
  const picks = [...scored.filter((g) => g.type === 'game').slice(0, 8 - codes.length), ...codes].sort((a, b) => b.score - a.score);
  res.json({ games: picks, personalised: owned.length > 0 });
});
