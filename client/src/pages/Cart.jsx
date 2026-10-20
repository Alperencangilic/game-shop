import { Link } from 'react-router-dom';
import { api } from '../api.js';
import GameImage from '../components/GameImage.jsx';
import { Alert, EmptyState, ErrorBox, Loading } from '../components/Loading.jsx';
import PriceTag from '../components/PriceTag.jsx';
import PurchaseDone from '../components/PurchaseDone.jsx';
import ReasonButton from '../components/ReasonButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { useLiveEvent } from '../context/LiveContext.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useBrowser.js';
import { useCheckout } from '../hooks/useCheckout.js';
import { formatMoney } from '../utils/format.js';

export default function Cart() {
  useDocumentTitle('Cart');
  const { user } = useAuth();
  const shop = useShop();
  const confirm = useConfirm();
  const toast = useToast();
  const { data, error, loading, reload } = useApi('/cart');
  const { checkout, busy, completedOrder, clearCompleted } = useCheckout();

  // prices or stock can change while the cart is open
  useLiveEvent((event) => {
    if (event.type === 'catalog-changed' || (event.type === 'game-updated' && data?.items.some((i) => i.id === event.gameId))) reload({ quiet: true });
  });

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const items = data.items;
  const blocked = items.filter((i) => i.problem);
  const payable = items.filter((i) => !i.problem);
  const { subtotalCents, discountCents, totalCents } = data.summary;
  const missing = totalCents - user.balanceCents;

  const remove = async (item) => {
    if (await shop.removeFromCart(item)) reload({ quiet: true });
  };

  const saveForLater = async (item) => {
    if (!shop.wishlist.has(item.id)) await shop.toggleWishlist(item);
    if (await shop.removeFromCart(item, { silent: true })) reload({ quiet: true });
  };

  const clearCart = async () => {
    if (!(await confirm({ title: 'Empty cart?', message: 'All products will be removed from your cart.', confirmLabel: 'Empty cart', tone: 'danger' }))) return;
    await api.del('/cart');
    await shop.reload();
    reload({ quiet: true });
    toast.info('Your cart is empty now.');
  };

  const pay = async () => {
    await checkout({ games: payable, totalCents, gameIds: payable.map((g) => g.id) });
    reload({ quiet: true });
  };

  let checkoutReason = null;
  if (payable.length === 0) checkoutReason = 'There is nothing in your cart that can be bought.';
  else if (blocked.length > 0) checkoutReason = 'Remove the products marked in red first.';

  return (
    <div>
      <div className="page-head">
        <h1>Shopping cart</h1>
        {items.length > 0 && (
          <button type="button" className="btn btn-outline" onClick={clearCart}>
            Empty cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState title="Your cart is empty" action={<Link to="/" className="btn btn-primary">Go to store</Link>} />
      ) : (
        <div className="cart-layout">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th />
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={item.problem ? 'problem-row' : ''}>
                  <td style={{ width: 110 }}>
                    <GameImage game={item} className="thumb" />
                  </td>
                  <td>
                    <Link to={`/games/${item.id}`}>
                      <b>{item.title}</b>
                    </Link>
                    <div className="muted small">{item.genre}</div>
                    {item.promotion && <div className="small">{item.promotion.name}</div>}
                    {item.problem && <div className="error-text">{item.problem}</div>}
                  </td>
                  <td>
                    <PriceTag game={item} />
                  </td>
                  <td>
                    <button type="button" className="btn-link" onClick={() => saveForLater(item)}>
                      Save for later
                    </button>
                    <br />
                    <button type="button" className="btn-link danger" onClick={() => remove(item)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="card">
            <h3>Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatMoney(subtotalCents)}</span>
            </div>
            {discountCents > 0 && (
              <div className="summary-row success-text">
                <span>Discount</span>
                <span>-{formatMoney(discountCents)}</span>
              </div>
            )}
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{formatMoney(totalCents)}</span>
            </div>
            <div className="summary-row muted">
              <span>Your balance</span>
              <span>{formatMoney(user.balanceCents)}</span>
            </div>
            {missing > 0 && (
              <Alert type="warning" action={<Link to="/account?tab=wallet">Add money to wallet</Link>}>
                Not enough balance. You need {formatMoney(missing)} more.
              </Alert>
            )}
            {blocked.length > 0 && <Alert type="error">{blocked.length} product(s) cannot be bought and are not counted in the total.</Alert>}
            <ReasonButton reason={checkoutReason} className="btn btn-success btn-block" onClick={pay} disabled={busy}>
              {busy ? 'Please wait...' : 'Checkout'}
            </ReasonButton>
          </div>
        </div>
      )}

      {completedOrder && <PurchaseDone order={completedOrder} onClose={clearCompleted} />}
    </div>
  );
}
