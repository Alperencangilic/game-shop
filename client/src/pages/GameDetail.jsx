import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BuyButton from '../components/BuyButton.jsx';
import Countdown from '../components/Countdown.jsx';
import GameCard from '../components/GameCard.jsx';
import GameImage from '../components/GameImage.jsx';
import { Alert, EmptyState, ErrorBox, Loading } from '../components/Loading.jsx';
import PriceTag from '../components/PriceTag.jsx';
import PurchaseDone from '../components/PurchaseDone.jsx';
import Requirements from '../components/Requirements.jsx';
import Reviews from '../components/Reviews.jsx';
import { Stars } from '../components/Stars.jsx';
import StockLabel from '../components/StockLabel.jsx';
import Tabs from '../components/Tabs.jsx';
import WishlistButton from '../components/WishlistButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLiveEvent } from '../context/LiveContext.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useBrowser.js';
import { useCheckout } from '../hooks/useCheckout.js';
import { formatDate, formatMoney } from '../utils/format.js';
import { rememberViewed } from '../utils/storage.js';

export default function GameDetail() {
  const { id } = useParams();
  const { user, isCustomer, can } = useAuth();
  const shop = useShop();
  const { data, error, loading, reload } = useApi(`/games/${id}`);
  const similar = useApi(`/games/${id}/similar`);
  const { checkout, busy, completedOrder, clearCompleted } = useCheckout();
  const [tab, setTab] = useState('about');
  const game = data?.game;
  useDocumentTitle(game?.title);

  useEffect(() => {
    if (game) rememberViewed(game.id);
  }, [game]);

  useEffect(() => {
    setTab('about');
  }, [id]);

  useLiveEvent((event) => {
    if ((event.type === 'game-updated' && String(event.gameId) === id) || event.type === 'catalog-changed') reload({ quiet: true });
  });

  if (loading && !game) return <Loading />;
  if (error?.status === 404) {
    return <EmptyState title="Product not found" action={<Link to="/">Back to store</Link>}>{error.message}</EmptyState>;
  }
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const isGame = game.type === 'game';
  const owned = isGame && (shop.owned.has(game.id) || game.owned);
  const boughtBefore = shop.owned.has(game.id) || game.owned;
  const canBuyNow = isCustomer && !owned && game.isActive && game.stock > 0 && !shop.cart.has(game.id);

  const tabs = [{ id: 'about', label: 'About' }];
  if (isGame) tabs.push({ id: 'requirements', label: 'System requirements' });
  tabs.push({ id: 'reviews', label: 'Reviews', count: game.reviewCount });

  return (
    <div>
      <p className="small">
        <Link to="/">Store</Link> &gt; <Link to={`/?genre=${encodeURIComponent(game.genre)}`}>{game.genre}</Link> &gt; {game.title}
      </p>
      {!game.isActive && <Alert type="warning">This product is hidden from the store.</Alert>}

      <div className="detail">
        <div>
          <GameImage game={game} />
        </div>
        <div className="detail-info">
          <h1>{game.title}</h1>
          <p>
            <b>Developer:</b> {game.developer}
          </p>
          <p>
            <b>Publisher:</b> {game.publisher}
          </p>
          <p>
            <b>Release date:</b> {formatDate(game.releaseDate)}
          </p>
          <p>
            <b>Category:</b> {game.genre} | <b>PEGI:</b> {game.ageRating}
          </p>
          <p>
            <b>Platforms:</b> {game.platforms.join(', ')}
          </p>
          {isGame && (
            <p>
              <b>Rating:</b> <Stars value={game.rating} count={game.reviewCount} />
            </p>
          )}

          <div className="buy-box">
            <PriceTag game={game} big />
            {game.promotion && (
              <div>
                <b>{game.promotion.name}</b> - <Countdown endsAt={game.promotion.endsAt} label="ends in" />
              </div>
            )}
            <p>{owned ? <span className="badge badge-green">You own this game</span> : <StockLabel stock={game.stock} />}</p>
            <div className="buttons">
              <BuyButton game={game} />
              {canBuyNow && (
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={busy}
                  onClick={() => checkout({ games: [game], totalCents: game.finalPriceCents, gameIds: [game.id] })}
                >
                  Buy now ({formatMoney(game.finalPriceCents)})
                </button>
              )}
              <WishlistButton game={game} withText />
            </div>
            {owned && (
              <p>
                <Link to="/library">Go to your library to download it.</Link>
              </p>
            )}
            {!isGame && boughtBefore && <Alert type="info">You bought this code before. You can buy it again.</Alert>}
            {!owned && game.lowStock && <Alert type="warning">Hurry up, only {game.stock} left in stock!</Alert>}
            {game.stock <= 0 && <Alert type="error">Sold out. Add it to your wishlist to get a notification when it is back.</Alert>}
            {user && !isCustomer && (
              <Alert type="info" action={can('games.manage') && <Link to={`/admin/games?edit=${game.id}`}>Edit this product</Link>}>
                You are logged in as staff. Staff accounts cannot buy products.
              </Alert>
            )}
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'about' && (
        <div className="card">
          <p>{game.description || 'No description.'}</p>
          {!isGame && (
            <p className="muted">
              This is a digital code. After payment you can download the code from your library and redeem it on the official website.
            </p>
          )}
          <p className="muted small">Sold: {game.sales} times</p>
        </div>
      )}
      {tab === 'requirements' && isGame && <Requirements game={game} />}
      {tab === 'reviews' && <Reviews game={game} owned={boughtBefore} onChanged={() => reload({ quiet: true })} />}

      {similar.data?.games.length > 0 && (
        <>
          <h2>Similar products</h2>
          <div className="grid">
            {similar.data.games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </>
      )}

      {completedOrder && <PurchaseDone order={completedOrder} onClose={clearCompleted} />}
    </div>
  );
}
