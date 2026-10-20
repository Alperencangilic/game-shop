import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

// One EventSource (Server-Sent Events) connection for live updates
const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const { user } = useAuth();
  const listeners = useRef(new Set());
  const [status, setStatus] = useState('connecting');

  // reconnect when the user changes so personal events reach the right user
  useEffect(() => {
    const source = new EventSource('/api/events');
    let offlineTimer;
    source.onopen = () => {
      clearTimeout(offlineTimer);
      setStatus('live');
    };
    source.onerror = () => {
      clearTimeout(offlineTimer);
      offlineTimer = setTimeout(() => setStatus('offline'), 4000);
    };
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data);
        for (const listener of listeners.current) listener(event);
      } catch {}
    };
    return () => {
      clearTimeout(offlineTimer);
      source.close();
    };
  }, [user?.id]);

  const subscribe = useCallback((listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  return <LiveContext.Provider value={{ status, subscribe }}>{children}</LiveContext.Provider>;
}

export function useLiveEvent(handler) {
  const { subscribe } = useContext(LiveContext);
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    return subscribe((event) => handlerRef.current(event));
  }, [subscribe]);
}

export function useLiveStatus() {
  return useContext(LiveContext).status;
}
