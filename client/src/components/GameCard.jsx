import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext.jsx';
import BuyButton from './BuyButton.jsx';
import GameImage from './GameImage.jsx';
import PriceTag from './PriceTag.jsx';
import { Stars } from './Stars.jsx';
import StockLabel from './StockLabel.jsx';
import WishlistButton from './WishlistButton.jsx';

export default function GameCard({ game, reason }) {
  const shop = useShop();
  const owned = game.type === 'game' && (shop.owned.has(game.id) || game.owned);

  return (
    <div className="card game-card">
      <Link to={`/games/${game.id}`}>
        <GameImage game={game} />
      </Link>
      <div className="game-card-body">
        <Link to={`/games/${game.id}`} className="game-title">
          {game.title}
        </Link>
        <div className="muted small">
          {game.genre} | {game.platforms.join(', ')}
        </div>
        {reason && <div className="reason small">{reason}</div>}
        {game.type === 'game' && <Stars value={game.rating} count={game.reviewCount} />}
        <div className="small">{owned ? <span className="badge badge-green">Owned</span> : <StockLabel stock={game.stock} />}</div>
        <div className="game-card-footer">
          <PriceTag game={game} />
          <div className="buttons">
            <WishlistButton game={game} />
            <BuyButton game={game} small />
          </div>
        </div>
      </div>
    </div>
  );
}
