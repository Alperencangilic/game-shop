import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { audit, notifyUser } from '../../activity.js';
import { db } from '../../db.js';
import { publishToUser } from '../../events.js';
import { HttpError } from '../../errors.js';
import { requirePermission } from '../../middleware/auth.js';
import { ROLES, ROLE_LABELS } from '../../permissions.js';
import { countActiveAdmins, findUser } from '../../users.js';
import * as v from '../../validation.js';

// User management (admins only)
export const adminUsersRouter = Router();
adminUsersRouter.use(requirePermission('users.manage'));

adminUsersRouter.get('/', (req, res) => {
  const users = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.balance_cents, u.created_at, u.last_login_at,
         (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
         (SELECT COUNT(*) FROM library l WHERE l.user_id = u.id) AS game_count,
         (SELECT COALESCE(SUM(o.total_cents), 0) FROM orders o WHERE o.user_id = u.id AND o.status = 'paid') AS spent_cents
       FROM users u
       ORDER BY CASE u.role WHEN 'admin' THEN 0 WHEN 'manager' THEN 1 ELSE 2 END, u.name COLLATE NOCASE`
    )
    .all()
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      roleLabel: ROLE_LABELS[u.role],
      status: u.status,
      balanceCents: u.balance_cents,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
      orderCount: u.order_count,
      gameCount: u.game_count,
      spentCents: u.spent_cents,
    }));
  res.json({ users });
});

adminUsersRouter.post('/', async (req, res) => {
  const name = v.text(req.body.name, 'Name', 60, { min: 2 });
  const email = v.email(req.body.email);
  const password = v.password(req.body.password);
  const role = v.oneOf(req.body.role, ROLES, 'Role');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw new HttpError(409, 'An account with this email already exists.');
  }
  const hash = await bcrypt.hash(password, 12);
  const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email, hash, role);
  audit(req.user, 'user.create', `${name} <${email}> as ${ROLE_LABELS[role]}`);
  res.status(201).json({ id: Number(result.lastInsertRowid), message: `${name} can now sign in as ${ROLE_LABELS[role]}.` });
});

// There must always be at least one active admin
adminUsersRouter.patch('/:id', (req, res) => {
  const id = v.id(req.params.id, 'User');
  const user = findUser(id);
  if (!user) throw new HttpError(404, 'This user no longer exists.');
  const role = req.body.role === undefined ? user.role : v.oneOf(req.body.role, ROLES, 'Role');
  const status = req.body.status === undefined ? user.status : v.oneOf(req.body.status, ['active', 'suspended'], 'Status');

  if (id === req.user.id && role !== user.role) {
    throw new HttpError(409, 'You cannot change your own role. Ask another administrator to do it.');
  }
  if (id === req.user.id && status === 'suspended') {
    throw new HttpError(409, 'You cannot suspend your own account.');
  }
  const losesAdmin = user.role === 'admin' && user.status === 'active' && (role !== 'admin' || status !== 'active');
  if (losesAdmin && countActiveAdmins() <= 1) {
    throw new HttpError(409, 'This is the last active administrator. Make someone else an administrator first.');
  }

  db.prepare('UPDATE users SET role = ?, status = ? WHERE id = ?').run(role, status, id);

  const changes = [];
  if (role !== user.role) {
    changes.push(`role ${ROLE_LABELS[user.role]} → ${ROLE_LABELS[role]}`);
    notifyUser(id, `Your role changed to ${ROLE_LABELS[role]}.`, { kind: 'info' });
  }
  if (status !== user.status) changes.push(status === 'suspended' ? 'suspended' : 'reactivated');
  audit(req.user, 'user.update', `${user.name}: ${changes.join(', ') || 'no change'}`);
  publishToUser(id, { type: 'account-changed' });
  res.json({ message: `${user.name} updated${changes.length ? `: ${changes.join(', ')}` : ''}.` });
});

adminUsersRouter.delete('/:id', (req, res) => {
  const id = v.id(req.params.id, 'User');
  const user = findUser(id);
  if (!user) throw new HttpError(404, 'This user no longer exists.');
  if (id === req.user.id) throw new HttpError(409, 'You cannot delete your own account while signed in.');
  if (user.role === 'admin' && countActiveAdmins() <= 1 && user.status === 'active') {
    throw new HttpError(409, 'This is the last active administrator and cannot be deleted.');
  }
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM orders WHERE user_id = ?').get(id);
  if (n > 0) {
    throw new HttpError(
      409,
      `${user.name} has ${n} order${n > 1 ? 's' : ''}. Order records are kept for reports, so this account cannot be deleted. Suspend it instead.`,
      { code: 'HAS_ORDERS' }
    );
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  audit(req.user, 'user.delete', `${user.name} <${user.email}>`);
  publishToUser(id, { type: 'account-changed' });
  res.json({ message: `${user.name} was deleted.` });
});
