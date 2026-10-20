import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { MAX_BALANCE_CENTS, TOP_UP_AMOUNTS } from '../constants.js';
import { db } from '../db.js';
import { HttpError } from '../errors.js';
import { COOKIE_NAME, requirePermission, requireUser } from '../middleware/auth.js';
import { formatCents } from '../money.js';
import { findUser, publicUser } from '../users.js';
import * as v from '../validation.js';

// Own account: profile, password, wallet, delete, notifications
export const accountRouter = Router();
accountRouter.use(['/account', '/notifications'], requireUser);

accountRouter.patch('/account', (req, res) => {
  const name = v.text(req.body.name, 'Name', 60, { min: 2 });
  const email = v.email(req.body.email);
  const taken = db.prepare('SELECT 1 FROM users WHERE email = ? AND id <> ?').get(email, req.user.id);
  if (taken) throw new HttpError(409, 'Another account already uses this email.');

  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, req.user.id);
  res.json({ user: publicUser(findUser(req.user.id)), message: 'Profile saved.' });
});

accountRouter.post('/account/password', async (req, res) => {
  const current = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const next = v.password(req.body.newPassword, 'New password');
  const user = findUser(req.user.id);

  if (!(await bcrypt.compare(current, user.password_hash))) {
    throw new HttpError(400, 'Your current password is incorrect.');
  }
  if (await bcrypt.compare(next, user.password_hash)) {
    throw new HttpError(400, 'The new password must be different from the current one.');
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await bcrypt.hash(next, 12), user.id);
  res.json({ message: 'Password changed.' });
});

accountRouter.get('/account/wallet', requirePermission('store.purchase'), (req, res) => {
  const transactions = db
    .prepare(
      `SELECT id, amount_cents, type, note, order_id, created_at FROM wallet_transactions
       WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`
    )
    .all(req.user.id)
    .map((t) => ({
      id: t.id,
      amountCents: t.amount_cents,
      type: t.type,
      note: t.note,
      orderId: t.order_id,
      createdAt: t.created_at,
    }));
  res.json({ balanceCents: req.user.balance_cents, transactions });
});

accountRouter.post('/account/wallet/top-up', requirePermission('store.purchase'), (req, res) => {
  const amount = Number(req.body.amountCents);
  if (!TOP_UP_AMOUNTS.includes(amount)) {
    throw new HttpError(400, `Choose one of the top-up amounts: ${TOP_UP_AMOUNTS.map(formatCents).join(', ')}.`);
  }
  if (req.user.balance_cents + amount > MAX_BALANCE_CENTS) {
    throw new HttpError(
      400,
      `Your wallet can hold at most ${formatCents(MAX_BALANCE_CENTS)}. You can add up to ${formatCents(MAX_BALANCE_CENTS - req.user.balance_cents)} right now.`
    );
  }

  db.transaction(() => {
    db.prepare('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?').run(amount, req.user.id);
    db.prepare("INSERT INTO wallet_transactions (user_id, amount_cents, type, note) VALUES (?, ?, 'top-up', 'Wallet top-up')").run(
      req.user.id,
      amount
    );
  })();
  res.json({ user: publicUser(findUser(req.user.id)), message: `${formatCents(amount)} added to your wallet.` });
});


accountRouter.delete('/account', async (req, res) => {
  if (req.user.role !== 'customer') {
    throw new HttpError(403, 'Staff accounts cannot be deleted here. Ask another administrator to remove the account.');
  }
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = findUser(req.user.id);
  if (!(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(400, 'Password is incorrect. Your account was not deleted.');
  }
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM orders WHERE user_id = ?').get(user.id);
  if (n > 0) {
    throw new HttpError(
      409,
      `Your account has ${n} order${n > 1 ? 's' : ''}. Order records must be kept for accounting, so this account cannot be deleted. Contact support to close it instead.`
    );
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Your account was deleted.' });
});


accountRouter.get('/notifications', (req, res) => {
  const items = db
    .prepare(
      'SELECT id, kind, message, link, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 30'
    )
    .all(req.user.id)
    .map((n) => ({ id: n.id, kind: n.kind, message: n.message, link: n.link, read: Boolean(n.is_read), createdAt: n.created_at }));
  res.json({ items, unread: items.filter((n) => !n.read).length });
});

accountRouter.patch('/notifications/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
  res.json({ ok: true });
});

accountRouter.patch('/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(v.id(req.params.id), req.user.id);
  res.json({ ok: true });
});

accountRouter.delete('/notifications/:id', (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(v.id(req.params.id), req.user.id);
  res.json({ ok: true });
});

accountRouter.delete('/notifications', (req, res) => {
  db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});
