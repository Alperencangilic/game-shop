// localStorage helpers (wrapped in try/catch because storage can be blocked)
export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const RECENT_KEY = 'gs.recentlyViewed';

export function rememberViewed(gameId) {
  const list = readJson(RECENT_KEY, []).filter((id) => id !== gameId);
  list.unshift(gameId);
  writeJson(RECENT_KEY, list.slice(0, 6));
}

export function recentlyViewed() {
  return readJson(RECENT_KEY, []);
}
