import { useCountdown } from '../hooks/useCountdown.js';

export default function Countdown({ endsAt, label = 'Ends in' }) {
  const { done, text } = useCountdown(endsAt);
  if (!endsAt) return null;
  return <span className="countdown">{done ? 'Offer ended' : `${label} ${text}`}</span>;
}
