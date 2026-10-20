// Demo data (runs only when the users table is empty)
import bcrypt from 'bcryptjs';
import { generateLicenseKey } from './license.js';
import { PRODUCTS } from './seedData.js';

const DAY = 24 * 60 * 60 * 1000;

const CUSTOMER_NAMES = [
  'Elif Demir', 'Jonas Berg', 'Maya Patel', 'Can Yilmaz', 'Sofia Rossi', 'Liam Walsh', 'Aiko Tanaka',
  'Mateo Garcia', 'Zeynep Arslan', 'Noah Fischer', 'Lena Novak', 'Omar Haddad', 'Chloe Martin', 'Kerem Aydin',
  'Hana Kim', 'Lucas Silva', 'Ece Sahin', 'Felix Wagner', 'Nora Lindqvist', 'Ivan Petrov',
];

const REVIEW_TEXT = {
  5: ['One of the best games I played this year.', 'Great value, totally worth it.', 'Bought it on sale, would pay full price too.', 'My friends and I play this every night.'],
  4: ['Really good, a few small bugs.', 'Fun, but the later parts are a bit slow.', 'Solid game. Worth it.', 'Nice graphics and good music.'],
  3: ['Fun for a while, then it gets repetitive.', 'Okay game, wait for a discount.', 'Average.'],
  2: ['Runs badly on my laptop.', 'Too short for the price.'],
};

// Same random numbers on every machine (mulberry32)
function createRandom(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedDatabase(raw) {
  if (raw.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0) return;

  console.log('Creating demo data...');
  const random = createRandom(475);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();

  const insertUser = raw.prepare(
    'INSERT INTO users (name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertGame = raw.prepare(
    `INSERT INTO games (title, type, developer, publisher, genre, description, image_url, platforms, release_date, age_rating,
       price_cents, stock, featured, storage_gb, min_os, min_cpu, min_gpu, min_ram_gb, min_vram_gb,
       rec_os, rec_cpu, rec_gpu, rec_ram_gb, rec_vram_gb, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertOrder = raw.prepare('INSERT INTO orders (user_id, total_cents, status, created_at, refunded_at) VALUES (?, ?, ?, ?, ?)');
  const insertItem = raw.prepare(
    'INSERT INTO order_items (order_id, game_id, title, unit_price_cents, discount_percent, paid_cents) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertLibrary = raw.prepare('INSERT INTO library (user_id, game_id, order_id, license_key, acquired_at) VALUES (?, ?, ?, ?, ?)');
  const insertDownload = raw.prepare('INSERT INTO downloads (user_id, game_id, library_id, file_name, downloaded_at) VALUES (?, ?, ?, ?, ?)');
  const insertReview = raw.prepare(
    'INSERT INTO reviews (user_id, game_id, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertWallet = raw.prepare(
    'INSERT INTO wallet_transactions (user_id, amount_cents, type, note, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertPromotion = raw.prepare(
    'INSERT INTO promotions (name, game_id, genre, discount_percent, starts_at, ends_at, created_by) VALUES (?, ?, ?, ?, ?, ?, 1)'
  );
  const insertNotification = raw.prepare('INSERT INTO notifications (user_id, kind, message, link, created_at) VALUES (?, ?, ?, ?, ?)');

  const hashes = {
    admin: bcrypt.hashSync('admin123', 10),
    manager: bcrypt.hashSync('manager123', 10),
    customer: bcrypt.hashSync('customer123', 10),
  };

  raw.transaction(() => {
    const addUser = (name, email, hash, role, { status = 'active', daysAgo = 120 } = {}) =>
      Number(insertUser.run(name, email, hash, role, status, iso(now - daysAgo * DAY)).lastInsertRowid);

    addUser('Ada Yildiz', 'admin@gameshop.local', hashes.admin, 'admin', { daysAgo: 200 });
    addUser('Morgan Lee', 'manager@gameshop.local', hashes.manager, 'manager', { daysAgo: 150 });
    const demoId = addUser('Deniz Kaya', 'customer@gameshop.local', hashes.customer, 'customer', { daysAgo: 45 });
    addUser('Riley Stone', 'suspended@gameshop.local', hashes.customer, 'customer', { status: 'suspended', daysAgo: 90 });
    const customerIds = CUSTOMER_NAMES.map((name, i) =>
      addUser(name, `${name.toLowerCase().replace(' ', '.')}@example.com`, hashes.customer, 'customer', { daysAgo: 85 - i * 3 })
    );

    const products = PRODUCTS.map((p, index) => {
      const r = p.requirements;
      const id = Number(
        insertGame.run(
          p.title, p.type, p.developer, p.publisher, p.genre, p.description, p.imageUrl, p.platforms.join(','), p.releaseDate,
          p.ageRating, p.price, p.stock, p.featured, r?.storageGb ?? 1,
          r?.minimum.os ?? '', r?.minimum.cpu ?? '', r?.minimum.gpu ?? '', r?.minimum.ramGb ?? 1, r?.minimum.vramGb ?? 0,
          r?.recommended.os ?? '', r?.recommended.cpu ?? '', r?.recommended.gpu ?? '', r?.recommended.ramGb ?? 1, r?.recommended.vramGb ?? 0,
          iso(now - (100 - index) * DAY)
        ).lastInsertRowid
      );
      return { id, title: p.title, type: p.type, price: p.price, release: p.releaseDate, popularity: p.popularity };
    });
    const byTitle = Object.fromEntries(products.map((p) => [p.title, p]));

    // Orders: plan them first, then insert by date so ids grow with time
    const planned = [];
    const ownedGames = new Map();
    const total = products.reduce((sum, p) => sum + p.popularity, 0);
    const weighted = () => {
      let r = random() * total;
      for (const p of products) {
        r -= p.popularity;
        if (r <= 0) return p;
      }
      return products[products.length - 1];
    };

    for (const userId of customerIds) {
      ownedGames.set(userId, new Set());
      const orderCount = 2 + Math.floor(random() * 5);
      for (let o = 0; o < orderCount; o++) {
        const createdMs = now - (Math.pow(random(), 1.5) * 70 + 0.2) * DAY;
        const date = iso(createdMs).slice(0, 10);
        const items = [];
        const itemCount = 1 + Math.floor(random() * 3);
        for (let tries = 0; tries < 12 && items.length < itemCount; tries++) {
          const p = weighted();
          if (p.release > date || items.some((i) => i.p.id === p.id)) continue;
          if (p.type === 'game' && ownedGames.get(userId).has(p.id)) continue;
          if (p.type === 'game') ownedGames.get(userId).add(p.id);
          const discount = random() < 0.3 ? pick([10, 15, 20, 25, 30]) : 0;
          items.push({ p, discount, paid: Math.round((p.price * (100 - discount)) / 100) });
        }
        if (items.length) planned.push({ userId, createdMs, items });
      }
    }

    // Fixed history for the demo customer
    for (const [daysAgo, titles] of [[35, ['Stardew Valley']], [20, ['Terraria', 'Valorant 475 VP']]]) {
      planned.push({ userId: demoId, createdMs: now - daysAgo * DAY, items: titles.map((t) => ({ p: byTitle[t], discount: 0, paid: byTitle[t].price })) });
    }

    planned.sort((a, b) => a.createdMs - b.createdMs);
    const refundedIndexes = new Set([7, 23]);
    const spent = new Map();
    const firstOrderAt = new Map();

    planned.forEach((order, index) => {
      const sum = order.items.reduce((s, i) => s + i.paid, 0);
      const refunded = refundedIndexes.has(index) && order.userId !== demoId;
      const createdAt = iso(order.createdMs);
      const orderId = Number(
        insertOrder.run(order.userId, sum, refunded ? 'refunded' : 'paid', createdAt, refunded ? iso(order.createdMs + DAY) : null).lastInsertRowid
      );
      if (!firstOrderAt.has(order.userId)) firstOrderAt.set(order.userId, order.createdMs);
      insertWallet.run(order.userId, -sum, 'purchase', `Order #${orderId}`, orderId, createdAt);
      if (refunded) insertWallet.run(order.userId, sum, 'refund', `Refund for order #${orderId}`, orderId, iso(order.createdMs + DAY));
      else spent.set(order.userId, (spent.get(order.userId) ?? 0) + sum);

      for (const { p, discount, paid } of order.items) {
        insertItem.run(orderId, p.id, p.title, p.price, discount, paid);
        if (refunded) continue;
        const libraryId = Number(insertLibrary.run(order.userId, p.id, orderId, generateLicenseKey(), createdAt).lastInsertRowid);

        const fileName = `${p.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${p.type === 'game' ? 'setup' : 'code'}.txt`;
        const count = p.type === 'game' ? Math.floor(random() * 3) : 1;
        for (let d = 0; d < count; d++) {
          insertDownload.run(order.userId, p.id, libraryId, fileName, iso(Math.min(now - 60000, order.createdMs + (d + random()) * DAY * 2)));
        }
        if (p.type === 'game' && order.userId !== demoId && random() < 0.55) {
          const rating = pick([5, 5, 4, 4, 4, 3, 5, 2, 4, 5]);
          const at = iso(Math.min(now - 60000, order.createdMs + random() * 5 * DAY));
          insertReview.run(order.userId, p.id, rating, pick(REVIEW_TEXT[rating]), at, at);
        }
      }
    });

    // Wallet: a top-up before the first order so balances add up
    for (const userId of [...customerIds, demoId]) {
      const used = spent.get(userId) ?? 0;
      const topUp = userId === demoId ? 15000 : Math.ceil((used + 2000 + random() * 15000) / 1000) * 1000;
      insertWallet.run(userId, topUp, 'top-up', 'Wallet top-up', null, iso((firstOrderAt.get(userId) ?? now - 10 * DAY) - 7200000));
      raw.prepare('UPDATE users SET balance_cents = ? WHERE id = ?').run(topUp - used, userId);
    }

    for (const title of ['ELDEN RING', 'Cyberpunk 2077', 'Black Myth: Wukong']) {
      raw.prepare('INSERT INTO wishlist (user_id, game_id) VALUES (?, ?)').run(demoId, byTitle[title].id);
    }

    insertPromotion.run('RPG Week', null, 'RPG', 25, iso(now - 2 * DAY), iso(now + 5 * DAY));
    insertPromotion.run('Forza Horizon 5 deal', byTitle['Forza Horizon 5'].id, null, 30, iso(now - DAY), iso(now + 12 * DAY));
    insertPromotion.run('Indie Weekend', null, 'Indie', 20, iso(now - 3 * DAY), iso(now + 2 * DAY + 6 * 3600000));
    insertPromotion.run('Valorant Points bonus', byTitle['Valorant 1000 VP'].id, null, 10, iso(now - DAY), iso(now + 6 * DAY));
    insertPromotion.run('Halloween Horror', null, 'Horror', 35, iso(now + 3 * DAY), iso(now + 10 * DAY));
    insertPromotion.run('Summer Sale', null, null, 15, iso(now - 60 * DAY), iso(now - 45 * DAY));

    insertNotification.run(demoId, 'info', 'Welcome to Game Shop! Your wallet has $150.00 of demo credit.', '/account?tab=wallet', iso(now - 45 * DAY));
    insertNotification.run(demoId, 'sale', 'Cyberpunk 2077 from your wishlist is 25% off (RPG Week).', `/games/${byTitle['Cyberpunk 2077'].id}`, iso(now - 2 * DAY));
    raw.prepare("INSERT INTO audit_log (user_id, user_name, action, details) VALUES (NULL, 'System', 'seed', 'Demo data created')").run();
  })();

  console.log('Demo data ready.');
}
