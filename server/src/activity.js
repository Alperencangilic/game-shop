import { db } from './db.js';
import { publishToUser } from './events.js';

export function audit(user, action, details = '') {
  db.prepare('INSERT INTO audit_log (user_id, user_name, action, details) VALUES (?, ?, ?, ?)').run(
    user?.id ?? null,
    user?.name ?? 'System',
    action,
    details
  );
}

export function notifyUser(userId, message, { kind = 'info', link = null } = {}) {
  db.prepare('INSERT INTO notifications (user_id, kind, message, link) VALUES (?, ?, ?, ?)').run(userId, kind, message, link);
  publishToUser(userId, { type: 'notification', kind, message, link });
}

// Notify everyone who has one of these games in their wishlist
export function notifyWishlisters(gameIds, makeMessage, kind = 'sale') {
  if (gameIds.length === 0) return;
  const rows = db
    .prepare(
      `SELECT w.user_id, g.id AS game_id, g.title FROM wishlist w JOIN games g ON g.id = w.game_id
       WHERE w.game_id IN (${gameIds.map(() => '?').join(', ')})`
    )
    .all(...gameIds);
  for (const row of rows) notifyUser(row.user_id, makeMessage(row.title), { kind, link: `/games/${row.game_id}` });
}
