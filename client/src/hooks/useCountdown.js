import { useEffect, useState } from 'react';

// Returns text like "2d 04:12:33" and updates every second
export function useCountdown(endsAt) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (!endsAt) return { done: true, text: '' };
  const left = Math.max(0, new Date(endsAt).getTime() - now);
  const days = Math.floor(left / 86400000);
  const pad = (n) => String(n).padStart(2, '0');
  const clock = `${pad(Math.floor((left % 86400000) / 3600000))}:${pad(Math.floor((left % 3600000) / 60000))}:${pad(Math.floor((left % 60000) / 1000))}`;
  return { done: left === 0, text: days > 0 ? `${days}d ${clock}` : clock };
}
