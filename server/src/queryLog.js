// Last SQL queries for the admin log page (only the SQL text, no values)

const MAX_ENTRIES = 400;
const entries = [];
let nextId = 1;
let enabled = false;

export function enableQueryLog() {
  enabled = true;
}

export function recordQuery(sql, durationMs, result) {
  if (!enabled) return;
  const text = sql.replace(/\s+/g, ' ').trim();
  const keyword = (text.match(/^(\w+)/)?.[1] ?? '').toUpperCase();
  entries.push({
    id: nextId++,
    at: new Date().toISOString(),
    type: keyword === 'WITH' ? 'SELECT' : keyword,
    sql: text,
    ms: Math.round(durationMs * 100) / 100,
    ...result,
  });
  if (entries.length > MAX_ENTRIES) entries.shift();
}

export function getQueryLog(sinceId = 0) {
  return entries.filter((entry) => entry.id > sinceId);
}

export function clearQueryLog() {
  entries.length = 0;
}
