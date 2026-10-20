// Input checks. Each helper returns a clean value or throws HttpError(400).
import { HttpError } from './errors.js';
import { AGE_RATINGS, GENRES, PLATFORMS, PRODUCT_TYPES } from './constants.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function text(value, label, max, { allowEmpty = false, min = 1 } = {}) {
  if (typeof value !== 'string') {
    if (allowEmpty && (value === undefined || value === null)) return '';
    throw new HttpError(400, `${label} is required.`);
  }
  const trimmed = value.trim();
  if (!trimmed && allowEmpty) return '';
  if (!trimmed) throw new HttpError(400, `${label} is required.`);
  if (trimmed.length < min) throw new HttpError(400, `${label} must be at least ${min} characters.`);
  if (trimmed.length > max) throw new HttpError(400, `${label} must be at most ${max} characters.`);
  return trimmed;
}

export function integer(value, label, min, max) {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${label} must be a whole number between ${min} and ${max}.`);
  }
  return n;
}

export function id(value, label = 'Id') {
  return integer(value, label, 1, Number.MAX_SAFE_INTEGER);
}

export function oneOf(value, list, label) {
  if (!list.includes(value)) throw new HttpError(400, `${label} must be one of: ${list.join(', ')}.`);
  return value;
}

export function email(value) {
  const clean = text(value, 'Email', 120).toLowerCase();
  if (!EMAIL_RE.test(clean)) throw new HttpError(400, 'Enter a valid email address, like name@example.com.');
  return clean;
}

// 8-72 chars (bcrypt limit), at least one letter and one number
export function password(value, label = 'Password') {
  if (typeof value !== 'string' || value.length < 8 || value.length > 72) {
    throw new HttpError(400, `${label} must be between 8 and 72 characters.`);
  }
  if (!/[a-z]/i.test(value) || !/\d/.test(value)) {
    throw new HttpError(400, `${label} must contain at least one letter and one number.`);
  }
  return value;
}

export function priceToCents(value) {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(n) || n < 0 || n > 999.99) {
    throw new HttpError(400, 'Price must be a number between 0 and 999.99.');
  }
  return Math.round(n * 100);
}

export function isoDate(value, label) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new HttpError(400, `${label} is not a valid date.`);
  return date.toISOString();
}

export function day(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(value).getTime())) {
    throw new HttpError(400, `${label} must be a date in YYYY-MM-DD format.`);
  }
  return value;
}

function imageUrl(value) {
  const url = text(value, 'Image URL', 500, { allowEmpty: true });
  if (url && !/^https?:\/\//i.test(url)) throw new HttpError(400, 'Image URL must start with http:// or https://');
  return url;
}

const bool = (value) => (value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0);

// Returns only known columns, so the result can be used to build SQL safely
export function parseGameFields(body, { partial = false } = {}) {
  const has = (key) => body[key] !== undefined;
  const out = {};

  if (!partial || has('title')) out.title = text(body.title, 'Title', 120, { min: 2 });
  if (!partial || has('type')) out.type = oneOf(body.type ?? 'game', PRODUCT_TYPES, 'Type');
  if (!partial || has('developer')) out.developer = text(body.developer, 'Developer', 80);
  if (!partial || has('publisher')) out.publisher = text(body.publisher, 'Publisher', 80);
  if (!partial || has('genre')) out.genre = oneOf(body.genre, GENRES, 'Genre');
  if (!partial || has('description')) out.description = text(body.description, 'Description', 2000, { allowEmpty: true });
  if (!partial || has('imageUrl')) out.image_url = imageUrl(body.imageUrl);
  if (!partial || has('platforms')) {
    const list = Array.isArray(body.platforms) ? body.platforms : [];
    const clean = PLATFORMS.filter((p) => list.includes(p));
    if (clean.length === 0) throw new HttpError(400, 'Choose at least one platform.');
    out.platforms = clean.join(',');
  }
  if (!partial || has('releaseDate')) out.release_date = day(body.releaseDate, 'Release date');
  if (!partial || has('ageRating')) out.age_rating = Number(oneOf(Number(body.ageRating), AGE_RATINGS, 'Age rating'));
  if (!partial || has('price')) out.price_cents = priceToCents(body.price);
  if (!partial || has('stock')) out.stock = integer(body.stock, 'Stock', 0, 100000);
  if (!partial || has('featured')) out.featured = bool(body.featured);
  if (!partial || has('isActive')) out.is_active = has('isActive') ? bool(body.isActive) : 1;

  // E-pins (VP, RP, gift cards...) have no system requirements
  if ((!partial || has('requirements')) && out.type !== 'epin' && body.requirements) {
    const req = body.requirements;
    const min = req.minimum ?? {};
    const rec = req.recommended ?? {};
    out.storage_gb = integer(req.storageGb, 'Storage', 1, 500);
    out.min_os = text(min.os, 'Minimum OS', 150, { allowEmpty: true });
    out.min_cpu = text(min.cpu, 'Minimum processor', 150, { allowEmpty: true });
    out.min_gpu = text(min.gpu, 'Minimum graphics card', 150, { allowEmpty: true });
    out.min_ram_gb = integer(min.ramGb, 'Minimum memory', 1, 128);
    out.min_vram_gb = integer(min.vramGb, 'Minimum video memory', 0, 48);
    out.rec_os = text(rec.os, 'Recommended OS', 150, { allowEmpty: true });
    out.rec_cpu = text(rec.cpu, 'Recommended processor', 150, { allowEmpty: true });
    out.rec_gpu = text(rec.gpu, 'Recommended graphics card', 150, { allowEmpty: true });
    out.rec_ram_gb = integer(rec.ramGb, 'Recommended memory', 1, 128);
    out.rec_vram_gb = integer(rec.vramGb, 'Recommended video memory', 0, 48);
    if (out.rec_ram_gb < out.min_ram_gb) throw new HttpError(400, 'Recommended memory cannot be lower than the minimum.');
    if (out.rec_vram_gb < out.min_vram_gb) throw new HttpError(400, 'Recommended video memory cannot be lower than the minimum.');
  }
  return out;
}
