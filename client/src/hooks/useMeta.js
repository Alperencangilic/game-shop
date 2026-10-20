import { useEffect, useState } from 'react';
import { api } from '../api.js';

// Genres, platforms, roles... loaded once from /api/meta
let metaPromise = null;

const EMPTY = { genres: [], platforms: ['Windows', 'macOS', 'Linux', 'Mobile'], ageRatings: [3, 7, 12, 16, 18], roles: [], topUpAmounts: [], maxBalanceCents: 0, lowStockLimit: 5 };

export function useMeta() {
  const [meta, setMeta] = useState(EMPTY);
  useEffect(() => {
    metaPromise ??= api.get('/meta').catch((err) => {
      metaPromise = null;
      throw err;
    });
    let active = true;
    metaPromise.then((data) => active && setMeta(data)).catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return meta;
}
