import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

// GET data with loading/error state. Pass null to skip.
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const requestId = useRef(0);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!path) return;
      const id = ++requestId.current;
      if (!quiet) setLoading(true);
      try {
        const result = await api.get(path);
        if (id === requestId.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (id === requestId.current) setError(err);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [path]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}
