import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Filters from '../components/Filters.jsx';
import GameCard from '../components/GameCard.jsx';
import { EmptyState, ErrorBox, Loading } from '../components/Loading.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useBrowser.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useGamesFeed } from '../hooks/useGamesFeed.js';
import { useMeta } from '../hooks/useMeta.js';
import { recentlyViewed } from '../utils/storage.js';

const PAGE_SIZE = 12;

const SORTS = {
  popular: { label: 'Best selling', compare: (a, b) => b.sales - a.sales },
  newest: { label: 'Newest', compare: (a, b) => b.releaseDate.localeCompare(a.releaseDate) },
  price_asc: { label: 'Price: low to high', compare: (a, b) => a.finalPriceCents - b.finalPriceCents },
  price_desc: { label: 'Price: high to low', compare: (a, b) => b.finalPriceCents - a.finalPriceCents },
  rating: { label: 'Rating', compare: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) },
  title: { label: 'Name A-Z', compare: (a, b) => a.title.localeCompare(b.title) },
};

const list = (value) => (value ? value.split(',').filter(Boolean) : []);

export default function Store() {
  useDocumentTitle('Store');
  const { isCustomer } = useAuth();
  const shop = useShop();
  const meta = useMeta();
  const { games, loading, error, reload } = useGamesFeed();
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const debouncedSearch = useDebounce(search, 300);

  const priceLimit = useMemo(() => Math.ceil(Math.max(10, ...games.map((g) => g.priceCents / 100))), [games]);

  // filters are saved in the URL (?genre=RPG&sale=1...)
  const filters = {
    type: params.get('type') ?? 'all',
    genres: list(params.get('genre')),
    platforms: list(params.get('platform')),
    maxPrice: params.get('max') ? Number(params.get('max')) : priceLimit,
    onSale: params.get('sale') === '1',
    inStock: params.get('stock') === '1',
    hideOwned: params.get('hideOwned') === '1',
    sort: SORTS[params.get('sort')] ? params.get('sort') : 'popular',
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    const urlKey = { genres: 'genre', platforms: 'platform', maxPrice: 'max', onSale: 'sale', inStock: 'stock' }[key] ?? key;
    let text = Array.isArray(value) ? value.join(',') : typeof value === 'boolean' ? (value ? '1' : '') : String(value);
    if ((key === 'maxPrice' && value >= priceLimit) || (key === 'type' && value === 'all') || (key === 'sort' && value === 'popular')) text = '';
    if (text) next.set(urlKey, text);
    else next.delete(urlKey);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if ((params.get('q') ?? '') !== debouncedSearch.trim()) setFilter('q', debouncedSearch.trim());
  }, [debouncedSearch]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [params]);

  const resetFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = (params.get('q') ?? '').toLowerCase();
    return games
      .filter((g) => !q || g.title.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q))
      .filter((g) => filters.type === 'all' || g.type === filters.type)
      .filter((g) => filters.genres.length === 0 || filters.genres.includes(g.genre))
      .filter((g) => filters.platforms.length === 0 || filters.platforms.some((p) => g.platforms.includes(p)))
      .filter((g) => g.finalPriceCents <= filters.maxPrice * 100)
      .filter((g) => !filters.onSale || g.discountPercent > 0)
      .filter((g) => !filters.inStock || g.stock > 0)
      .filter((g) => !filters.hideOwned || g.type !== 'game' || !shop.owned.has(g.id))
      .sort(SORTS[filters.sort].compare);
  }, [games, params, shop.owned]);

  const genreCounts = useMemo(() => {
    const counts = {};
    for (const g of games) counts[g.genre] = (counts[g.genre] ?? 0) + 1;
    return meta.genres.filter((genre) => counts[genre]).map((genre) => ({ genre, count: counts[genre] }));
  }, [games, meta.genres]);

  const featured = games.filter((g) => g.featured).slice(0, 4);
  const recommendations = useApi(isCustomer ? `/recommendations?n=${shop.owned.size}` : null);
  const recent = recentlyViewed()
    .map((id) => games.find((g) => g.id === id))
    .filter(Boolean);
  const noFilters = params.toString() === '';

  if (error && games.length === 0) return <ErrorBox error={error} onRetry={reload} />;

  return (
    <div>
      {noFilters && featured.length > 0 && (
        <>
          <h2>Featured games</h2>
          <div className="grid grid-row">
            {featured.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </>
      )}

      {noFilters && isCustomer && recommendations.data?.games.length > 0 && (
        <>
          <h2>Recommended for you</h2>
          <div className="grid grid-row">
            {recommendations.data.games.slice(0, 4).map((game) => (
              <GameCard key={game.id} game={game} reason={game.reason} />
            ))}
          </div>
        </>
      )}

      <h2>All products</h2>
      <div className="toolbar">
        <input className="search" type="search" placeholder="Search by name or developer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
        <span className="muted">{loading ? 'Loading...' : `${filtered.length} of ${games.length} products`}</span>
      </div>

      <div className="store-layout">
        <Filters
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          genreCounts={genreCounts}
          platforms={meta.platforms}
          priceLimit={priceLimit}
          showOwnedFilter={isCustomer}
        />
        <div>
          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No products found"
              action={
                <button type="button" className="btn btn-primary" onClick={resetFilters}>
                  Clear filters
                </button>
              }
            >
              Try another search or remove some filters.
            </EmptyState>
          ) : (
            <>
              <div className="grid">
                {filtered.slice(0, visible).map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
              {visible < filtered.length && (
                <p className="center">
                  <button type="button" className="btn btn-secondary" onClick={() => setVisible(visible + PAGE_SIZE)}>
                    Load more ({filtered.length - visible} left)
                  </button>
                </p>
              )}
            </>
          )}
          {recent.length > 0 && (
            <p className="small">
              <b>Recently viewed:</b>{' '}
              {recent.map((g, i) => (
                <span key={g.id}>
                  {i > 0 && ', '}
                  <Link to={`/games/${g.id}`}>{g.title}</Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
