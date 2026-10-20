import { Link } from 'react-router-dom';
import GameCard from '../components/GameCard.jsx';
import { Alert, EmptyState, ErrorBox, Loading } from '../components/Loading.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useBrowser.js';

export default function Wishlist() {
  useDocumentTitle('Wishlist');
  const shop = useShop();
  // reload when a heart is clicked somewhere
  const { data, error, loading, reload } = useApi(`/wishlist?n=${shop.wishlist.size}`);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const games = data.games.filter((g) => shop.wishlist.has(g.id));

  return (
    <div>
      <h1>My wishlist</h1>
      {games.length === 0 ? (
        <EmptyState title="Your wishlist is empty" action={<Link to="/" className="btn btn-primary">Go to store</Link>}>
          Click the ♡ button on a product to add it here.
        </EmptyState>
      ) : (
        <>
          <Alert type="info">You will get a notification when a product here goes on sale or comes back in stock.</Alert>
          <div className="grid">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
