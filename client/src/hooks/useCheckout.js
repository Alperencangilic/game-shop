import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatMoney } from '../utils/format.js';

// Checkout used by the cart page and the "Buy now" button
export function useCheckout() {
  const { user, refresh } = useAuth();
  const shop = useShop();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const checkout = async ({ games, totalCents, gameIds }) => {
    const balance = user.balanceCents;
    if (balance < totalCents) {
      const topUp = await confirm({
        title: 'Not enough balance',
        message: `This order costs ${formatMoney(totalCents)} but you have ${formatMoney(balance)}. You need ${formatMoney(totalCents - balance)} more.`,
        confirmLabel: 'Go to wallet',
        tone: 'warning',
      });
      if (topUp) navigate('/account?tab=wallet');
      return null;
    }

    const ok = await confirm({
      title: games.length === 1 ? `Buy ${games[0].title}?` : `Buy ${games.length} products?`,
      message: `${formatMoney(totalCents)} will be paid from your wallet.`,
      details: [`Balance now: ${formatMoney(balance)}`, `Balance after: ${formatMoney(balance - totalCents)}`],
      confirmLabel: `Pay ${formatMoney(totalCents)}`,
    });
    if (!ok) return null;

    setBusy(true);
    try {
      // the server rejects the order if the total changed meanwhile
      const { order, message } = await api.post('/checkout', { gameIds, expectedTotalCents: totalCents });
      shop.markPurchased(order.entries.map((e) => e.id));
      await refresh();
      toast.success(message);
      setCompletedOrder(order);
      return order;
    } catch (err) {
      toast.error(err.message);
      shop.reload().catch(() => {});
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { checkout, busy, completedOrder, clearCompleted: () => setCompletedOrder(null) };
}
