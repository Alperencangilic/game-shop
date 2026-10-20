import { useAuth } from '../context/AuthContext.jsx';
import { useShop } from '../context/ShopContext.jsx';

// ♥ button, hidden for staff and for games the customer already owns
export default function WishlistButton({ game, withText = false }) {
  const { user, isCustomer } = useAuth();
  const shop = useShop();
  const owned = game.type === 'game' && (shop.owned.has(game.id) || game.owned);
  if ((user && !isCustomer) || owned) return null;

  const wished = shop.wishlist.has(game.id);
  return (
    <button
      type="button"
      className={`btn btn-outline ${withText ? '' : 'btn-sm'} ${wished ? 'wished' : ''}`}
      onClick={() => shop.toggleWishlist(game)}
      title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {wished ? '♥' : '♡'}
      {withText && (wished ? ' On wishlist' : ' Add to wishlist')}
    </button>
  );
}
