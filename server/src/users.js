import { db } from './db.js';
import { ROLE_LABELS, permissionsFor } from './permissions.js';

export function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    roleLabel: ROLE_LABELS[row.role],
    status: row.status,
    balanceCents: row.balance_cents,
    permissions: permissionsFor(row.role),
    createdAt: row.created_at,
  };
}

export function findUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function countActiveAdmins() {
  return db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active'").get().n;
}
