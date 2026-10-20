// SQLite database: schema + demo data on first start (npm run reset-db to start over)
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enableQueryLog, recordQuery } from './queryLog.js';
import { seedDatabase } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DB_FILE = process.env.DB_PATH || path.join(here, '..', 'data', 'store.db');
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

// Dates are saved as ISO strings so they sort correctly
const NOW = "(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'manager', 'admin')),
    status        TEXT    NOT NULL DEFAULT 'active'   CHECK (status IN ('active', 'suspended')),
    balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
    created_at    TEXT    NOT NULL DEFAULT ${NOW},
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS games (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    type         TEXT    NOT NULL DEFAULT 'game' CHECK (type IN ('game', 'epin')),
    developer    TEXT    NOT NULL,
    publisher    TEXT    NOT NULL,
    genre        TEXT    NOT NULL,
    description  TEXT    NOT NULL DEFAULT '',
    image_url    TEXT    NOT NULL DEFAULT '',
    platforms    TEXT    NOT NULL DEFAULT 'Windows',
    release_date TEXT    NOT NULL,
    age_rating   INTEGER NOT NULL DEFAULT 12 CHECK (age_rating IN (3, 7, 12, 16, 18)),
    price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    featured     INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
    is_active    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    storage_gb   INTEGER NOT NULL DEFAULT 1 CHECK (storage_gb > 0),
    min_os       TEXT    NOT NULL DEFAULT '',
    min_cpu      TEXT    NOT NULL DEFAULT '',
    min_gpu      TEXT    NOT NULL DEFAULT '',
    min_ram_gb   INTEGER NOT NULL DEFAULT 1,
    min_vram_gb  INTEGER NOT NULL DEFAULT 0,
    rec_os       TEXT    NOT NULL DEFAULT '',
    rec_cpu      TEXT    NOT NULL DEFAULT '',
    rec_gpu      TEXT    NOT NULL DEFAULT '',
    rec_ram_gb   INTEGER NOT NULL DEFAULT 1,
    rec_vram_gb  INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT ${NOW},
    updated_at   TEXT    NOT NULL DEFAULT ${NOW},
    CHECK (rec_ram_gb >= min_ram_gb AND rec_vram_gb >= min_vram_gb)
  );

  -- game_id = one game, genre = one genre, both NULL = whole store
  CREATE TABLE IF NOT EXISTS promotions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    game_id          INTEGER REFERENCES games(id) ON DELETE CASCADE,
    genre            TEXT,
    discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
    starts_at        TEXT    NOT NULL,
    ends_at          TEXT    NOT NULL,
    created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at       TEXT    NOT NULL DEFAULT ${NOW},
    CHECK (ends_at > starts_at),
    CHECK (game_id IS NULL OR genre IS NULL)
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id  INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    added_at TEXT    NOT NULL DEFAULT ${NOW},
    PRIMARY KEY (user_id, game_id)
  );

  CREATE TABLE IF NOT EXISTS wishlist (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id  INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    added_at TEXT    NOT NULL DEFAULT ${NOW},
    PRIMARY KEY (user_id, game_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    status      TEXT    NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded')),
    created_at  TEXT    NOT NULL DEFAULT ${NOW},
    refunded_at TEXT
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    game_id          INTEGER NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
    title            TEXT    NOT NULL,
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
    paid_cents       INTEGER NOT NULL CHECK (paid_cents >= 0),
    UNIQUE (order_id, game_id)
  );

  -- one row per bought key (e-pins can be bought more than once)
  CREATE TABLE IF NOT EXISTS library (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
    order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    license_key TEXT    NOT NULL UNIQUE,
    acquired_at TEXT    NOT NULL DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS downloads (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id       INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    library_id    INTEGER REFERENCES library(id) ON DELETE SET NULL,
    file_name     TEXT    NOT NULL,
    downloaded_at TEXT    NOT NULL DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT    NOT NULL DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT ${NOW},
    updated_at TEXT    NOT NULL DEFAULT ${NOW},
    UNIQUE (user_id, game_id)
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    type         TEXT    NOT NULL CHECK (type IN ('top-up', 'purchase', 'refund')),
    note         TEXT    NOT NULL DEFAULT '',
    order_id     INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    created_at   TEXT    NOT NULL DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT    NOT NULL DEFAULT 'info' CHECK (kind IN ('info', 'success', 'warning', 'sale')),
    message    TEXT    NOT NULL,
    link       TEXT,
    is_read    INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at TEXT    NOT NULL DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name  TEXT    NOT NULL,
    action     TEXT    NOT NULL,
    details    TEXT    NOT NULL DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT ${NOW}
  );

  CREATE INDEX IF NOT EXISTS idx_orders_user        ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_created     ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_order_items_game   ON order_items(game_id);
  CREATE INDEX IF NOT EXISTS idx_library_user       ON library(user_id, game_id);
  CREATE INDEX IF NOT EXISTS idx_downloads_user     ON downloads(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_promotions_window  ON promotions(starts_at, ends_at);
`;

const raw = new Database(DB_FILE);
raw.pragma('journal_mode = WAL');
raw.pragma('foreign_keys = ON');
raw.exec(SCHEMA);
seedDatabase(raw);

// Wrap statements so every query is written to the SQL log
function logged(statement, sql) {
  const track = (fn, describe) => {
    const started = performance.now();
    const result = fn();
    recordQuery(sql, performance.now() - started, describe(result));
    return result;
  };
  return {
    run: (...args) => track(() => statement.run(...args), (r) => ({ changes: r.changes })),
    get: (...args) => track(() => statement.get(...args), (r) => ({ rows: r ? 1 : 0 })),
    all: (...args) => track(() => statement.all(...args), (r) => ({ rows: r.length })),
  };
}

export const db = {
  prepare: (sql) => logged(raw.prepare(sql), sql),
  transaction: (fn) => raw.transaction(fn),
  raw, // not logged (used for the session check on every request)
};

enableQueryLog();
