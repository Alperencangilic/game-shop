import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { HttpError } from '../errors.js';
import { DENIED_MESSAGES, hasPermission } from '../permissions.js';

export const COOKIE_NAME = 'token';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const TOKEN_TTL_SECONDS = 2 * 60 * 60;

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: TOKEN_TTL_SECONDS * 1000,
};

export function issueToken(user) {
  return jwt.sign({}, JWT_SECRET, { subject: String(user.id), expiresIn: TOKEN_TTL_SECONDS });
}

const findSessionUser = db.raw.prepare(
  'SELECT id, name, email, role, status, balance_cents, created_at FROM users WHERE id = ?'
);

// Reads the user from the cookie. Role/status come from the DB on every request.
export function attachUser(req, res, next) {
  req.user = null;
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = findSessionUser.get(Number(payload.sub));
      if (user && user.status === 'active') req.user = user;
    } catch {
      req.user = null;
    }
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) throw new HttpError(401, 'Please sign in to continue.');
  next();
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) throw new HttpError(401, 'Please sign in to continue.');
    if (!hasPermission(req.user, permission)) {
      throw new HttpError(403, DENIED_MESSAGES[permission] ?? 'You do not have permission for this action.');
    }
    next();
  };
}
