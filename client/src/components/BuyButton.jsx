import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { getBuyState } from '../utils/buyState.js';
import ReasonButton from './ReasonButton.jsx';

// Main button of a product. Changes with the situation (in cart, owned, sold out...)
export default function BuyButton({ game, small = false }) {
  const { user } = useAuth();
  const shop = useShop();
  const navigate = useNavigate();
  const state = getBuyState(game, { user, shop });
  const size = small ? 'btn-sm' : '';

  if (state.kind === 'buy' || state.kind === 'guest') {
    return (
      <button type="button" className={`btn btn-primary ${size}`} onClick={() => shop.addToCart(game)}>
        {state.label}
      </button>
    );
  }
  if (state.kind === 'incart') {
    return (
      <button type="button" className={`btn btn-success ${size}`} onClick={() => navigate('/cart')}>
        In cart ✓
      </button>
    );
  }
  if (state.kind === 'owned') {
    return (
      <button type="button" className={`btn btn-secondary ${size}`} onClick={() => navigate('/library')}>
        In library
      </button>
    );
  }
  return (
    <ReasonButton reason={state.reason} className={`btn btn-secondary ${size}`}>
      {state.label}
    </ReasonButton>
  );
}
