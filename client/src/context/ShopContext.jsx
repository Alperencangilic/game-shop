import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { DENIED_MESSAGES } from '../utils/permissions.js';
import { useAuth } from './AuthContext.jsx';
import { useLiveEvent } from './LiveContext.jsx';
import { useToast } from './ToastContext.jsx';

// Cart / wishlist / owned ids of the logged in customer
const ShopContext = createContext(null);
const EMPTY = { cart: new Set(), wishlist: new Set(), owned: new Set() };

export function ShopProvider({ children }) {
  const { user, isCustomer, refresh: refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState(EMPTY);

  const reload = useCallback(async () => {
    if (!isCustomer) {
      setState(EMPTY);
      return;
    }
    const data = await api.get('/shop/state');
    setState({ cart: new Set(data.cart), wishlist: new Set(data.wishlist), owned: new Set(data.owned) });
  }, [isCustomer]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload, user?.id]);

  // e.g. an admin refunded our order
  useLiveEvent((event) => {
    if (event.type === 'account-changed') {
      refreshUser().catch(() => {});
      reload().catch(() => {});
    }
  });

  const ensureCustomer = useCallback(
    (what) => {
      if (!user) {
        toast.warning(`Please log in to ${what}.`);
        navigate('/login', { state: { from: location.pathname + location.search } });
        return false;
      }
      if (!isCustomer) {
        toast.warning(DENIED_MESSAGES['store.purchase']);
        return false;
      }
      return true;
    },
    [user, isCustomer, toast, navigate, location]
  );

  const update = (key, id, add) =>
    setState((current) => {
      const next = new Set(current[key]);
      if (add) next.add(id);
      else next.delete(id);
      return { ...current, [key]: next };
    });

  const addToCart = useCallback(
    async (game) => {
      if (!ensureCustomer('add products to your cart')) return false;
      try {
        await api.post('/cart', { gameId: game.id });
        update('cart', game.id, true);
        toast.success(`${game.title} was added to your cart.`, { action: { label: 'Go to cart', onClick: () => navigate('/cart') } });
        return true;
      } catch (err) {
        toast.error(err.message);
        reload().catch(() => {});
        return false;
      }
    },
    [ensureCustomer, toast, navigate, reload]
  );

  const removeFromCart = useCallback(
    async (game, { silent = false } = {}) => {
      try {
        await api.del(`/cart/${game.id}`);
        update('cart', game.id, false);
        if (!silent) toast.info(`${game.title} was removed from your cart.`);
        return true;
      } catch (err) {
        toast.error(err.message);
        return false;
      }
    },
    [toast]
  );

  const toggleWishlist = useCallback(
    async (game) => {
      if (!ensureCustomer('use the wishlist')) return false;
      const wished = state.wishlist.has(game.id);
      try {
        if (wished) {
          await api.del(`/wishlist/${game.id}`);
          toast.info(`${game.title} was removed from your wishlist.`);
        } else {
          await api.post('/wishlist', { gameId: game.id });
          toast.success(game.stock <= 0 ? `We will notify you when ${game.title} is back in stock.` : `${game.title} was added to your wishlist.`);
        }
        update('wishlist', game.id, !wished);
        return true;
      } catch (err) {
        toast.error(err.message);
        return false;
      }
    },
    [ensureCustomer, state.wishlist, toast]
  );

  const markPurchased = useCallback((ids) => {
    setState((current) => {
      const cart = new Set(current.cart);
      const wishlist = new Set(current.wishlist);
      const owned = new Set(current.owned);
      for (const id of ids) {
        cart.delete(id);
        wishlist.delete(id);
        owned.add(id);
      }
      return { cart, wishlist, owned };
    });
  }, []);

  const value = useMemo(
    () => ({ ...state, cartCount: state.cart.size, addToCart, removeFromCart, toggleWishlist, markPurchased, reload }),
    [state, addToCart, removeFromCart, toggleWishlist, markPurchased, reload]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  return useContext(ShopContext);
}
