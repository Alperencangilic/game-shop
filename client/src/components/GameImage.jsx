import { useState } from 'react';

// Product image; shows a gray box with the title if the image can't load (e.g. offline)
export default function GameImage({ game, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!game.imageUrl || failed) {
    return <div className={`game-img img-placeholder ${className}`}>{game.title}</div>;
  }
  return (
    <img
      className={`game-img ${game.type === 'epin' ? 'img-logo' : ''} ${className}`}
      src={game.imageUrl}
      alt={game.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
