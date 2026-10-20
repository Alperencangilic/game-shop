import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { HttpError } from '../errors.js';
import { COOKIE_NAME, cookieOptions, issueToken } from '../middleware/auth.js';
import { formatCents } from '../money.js';
import { publicUser } from '../users.js';
import * as v from '../validation.js';

export const authRouter = Router();

const WELCOME_CREDIT_CENTS = 5000;

// Max 30 login/register attempts per 15 minutes per IP
const attemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Wait 15 minutes, then try again.' },
});

function startSession(res, user) {
  res.cookie(COOKIE_NAME, issueToken(user), cookieOptions);
  return publicUser(user);
}

authRouter.post('/register', attemptLimiter, async (req, res) => {
  const name = v.text(req.body.name, 'Name', 60, { min: 2 });
  const email = v.email(req.body.email);
  const password = v.password(req.body.password);

  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw new HttpError(409, 'An account with this email already exists. Sign in instead, or use another email.');
  }

  const hash = await bcrypt.hash(password, 12);
  // Sign-up always creates a customer with some demo credit
  const userId = db.transaction(() => {
    const result = db
      .prepare("INSERT INTO users (name, email, password_hash, role, balance_cents, last_login_at) VALUES (?, ?, ?, 'customer', ?, ?)")
      .run(name, email, hash, WELCOME_CREDIT_CENTS, new Date().toISOString());
    const id = Number(result.lastInsertRowid);
    db.prepare("INSERT INTO wallet_transactions (user_id, amount_cents, type, note) VALUES (?, ?, 'top-up', 'Welcome credit')").run(
      id,
      WELCOME_CREDIT_CENTS
    );
    db.prepare("INSERT INTO notifications (user_id, kind, message, link) VALUES (?, 'success', ?, '/account?tab=wallet')").run(
      id,
      `Welcome to Game Shop, ${name.split(' ')[0]}! We added ${formatCents(WELCOME_CREDIT_CENTS)} of demo credit to your wallet.`
    );
    return id;
  })();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.status(201).json({ user: startSession(res, user) });
});

authRouter.post('/login', attemptLimiter, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) throw new HttpError(400, 'Enter your email and password.');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Same message for wrong email and wrong password
  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) throw new HttpError(401, 'Email or password is incorrect.');
  if (user.status === 'suspended') {
    throw new HttpError(403, 'This account is suspended. Contact support@gameshop.local to restore access.');
  }

  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);
  res.json({ user: startSession(res, user) });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});
