import { db } from './db.js';
import { LOW_STOCK_LIMIT } from './constants.js';

// Main game query: best active promotion, sales, rating and owned/cart/wishlist flags
const GAME_QUERY = `
  SELECT g.*,
    bp.name AS promo_name, bp.discount_percent AS promo_discount, bp.ends_at AS promo_ends_at,
    (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE oi.game_id = g.id AND o.status = 'paid') AS sales,
    (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.game_id = g.id) AS rating,
    (SELECT COUNT(*) FROM reviews r WHERE r.game_id = g.id) AS review_count,
    EXISTS (SELECT 1 FROM library l    WHERE l.game_id = g.id AND l.user_id = @userId) AS owned,
    EXISTS (SELECT 1 FROM cart_items c WHERE c.game_id = g.id AND c.user_id = @userId) AS in_cart,
    EXISTS (SELECT 1 FROM wishlist w   WHERE w.game_id = g.id AND w.user_id = @userId) AS wishlisted
  FROM games g
  LEFT JOIN promotions bp ON bp.id = (
    SELECT p.id FROM promotions p
    WHERE p.starts_at <= @now AND p.ends_at > @now
      AND (p.game_id = g.id OR p.genre = g.genre OR (p.game_id IS NULL AND p.genre IS NULL))
    ORDER BY p.discount_percent DESC, p.ends_at ASC
    LIMIT 1
  )`;

export const SORTS = {
  title: 'g.title COLLATE NOCASE',
  newest: 'g.release_date DESC, g.id DESC',
  price_asc: 'g.price_cents ASC, g.title COLLATE NOCASE',
  price_desc: 'g.price_cents DESC, g.title COLLATE NOCASE',
  popular: 'sales DESC, g.title COLLATE NOCASE',
  rating: 'rating DESC NULLS LAST, review_count DESC',
};

export function queryGames({ userId = null, where = '', params = {}, orderBy = SORTS.title, includeHidden = false } = {}) {
  const clauses = [];
  if (!includeHidden) clauses.push('g.is_active = 1');
  if (where) clauses.push(`(${where})`);
  const rows = db
    .prepare(`${GAME_QUERY} WHERE ${clauses.join(' AND ') || '1 = 1'} ORDER BY ${orderBy}`)
    .all({ now: new Date().toISOString(), userId, ...params });
  return rows.map(toGame);
}

export function getGame(id, { userId = null, includeHidden = false } = {}) {
  return queryGames({ userId, includeHidden, where: 'g.id = @id', params: { id } })[0] ?? null;
}

export function finalPrice(priceCents, discountPercent) {
  return Math.round((priceCents * (100 - discountPercent)) / 100);
}

function toGame(row) {
  const discountPercent = row.promo_discount ?? 0;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    developer: row.developer,
    publisher: row.publisher,
    genre: row.genre,
    description: row.description,
    imageUrl: row.image_url,
    platforms: row.platforms.split(',').filter(Boolean),
    releaseDate: row.release_date,
    ageRating: row.age_rating,
    featured: Boolean(row.featured),
    isActive: Boolean(row.is_active),
    priceCents: row.price_cents,
    discountPercent,
    finalPriceCents: finalPrice(row.price_cents, discountPercent),
    promotion: row.promo_name ? { name: row.promo_name, endsAt: row.promo_ends_at } : null,
    stock: row.stock,
    lowStock: row.stock > 0 && row.stock <= LOW_STOCK_LIMIT,
    sales: row.sales,
    rating: row.rating,
    reviewCount: row.review_count,
    owned: Boolean(row.owned),
    inCart: Boolean(row.in_cart),
    wishlisted: Boolean(row.wishlisted),
    requirements: {
      storageGb: row.storage_gb,
      minimum: { os: row.min_os, cpu: row.min_cpu, gpu: row.min_gpu, ramGb: row.min_ram_gb, vramGb: row.min_vram_gb },
      recommended: { os: row.rec_os, cpu: row.rec_cpu, gpu: row.rec_gpu, ramGb: row.rec_ram_gb, vramGb: row.rec_vram_gb },
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
